"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getDocuments, postQuery, toApiError, validateQuery, type ApiError } from "@/lib/api";
import { buttonSecondary, cn } from "@/lib/cn";
import { API_BASE_URL, IS_API_CONFIGURED, IS_USING_DEV_FALLBACK, MAX_QUERY_LENGTH } from "@/lib/config";
import { buildAnswerSources } from "@/lib/sources";
import type { QueryResponse } from "@/lib/types";

import { Reveal } from "@/components/site/Reveal";

import { AnswerPanel } from "./AnswerPanel";
import { ComparisonPanel } from "./ComparisonPanel";
import { PipelineIndicator } from "./PipelineIndicator";
import { QueryInput } from "./QueryInput";
import { SourcePanel } from "./SourcePanel";
import { StateMessage } from "./StateMessage";

type Status = "idle" | "loading" | "success" | "error";

/** Questions the indexed corpus can actually answer, from the eval set. */
const EXAMPLE_QUERIES = [
  "What is reciprocal rank fusion and how is the score calculated?",
  "Which retrieval failure mode does BM25 cover that dense search misses?",
  "What does the frontend never hold or use, per the security document?",
];

export function QueryWorkspace() {
  const [question, setQuestion] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [documentTitles, setDocumentTitles] = useState<Map<string, string>>(new Map());
  const [corpusIsEmpty, setCorpusIsEmpty] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [sourcesOpenOnMobile, setSourcesOpenOnMobile] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Document titles are the only thing that turns a doc_id UUID into a name.
  // A failure here is not fatal: source cards fall back to the short UUID.
  useEffect(() => {
    if (!IS_API_CONFIGURED) return;
    const controller = new AbortController();

    getDocuments(controller.signal)
      .then(({ documents }) => {
        setDocumentTitles(new Map(documents.map((doc) => [doc.doc_id, doc.title])));
        setCorpusIsEmpty(documents.length === 0);
      })
      .catch(() => {
        // Leave titles empty and let the query itself report connectivity.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Real elapsed time, measured in the browser, for the loading indicator.
  // The clock starts in the submit handler so the effect only has to tick.
  useEffect(() => {
    if (status !== "loading" || startedAt === null) return;
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);
    return () => window.clearInterval(timer);
  }, [status, startedAt]);

  const runQuery = useCallback(
    async (rawQuestion: string) => {
      const trimmed = rawQuestion.trim();

      if (!trimmed) {
        setValidationMessage("Enter a question before running a query.");
        return;
      }
      if (validateQuery(trimmed)) {
        setValidationMessage(
          `Queries are limited to ${MAX_QUERY_LENGTH} characters. Shorten the question and try again.`,
        );
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setValidationMessage(null);
      setElapsedMs(0);
      setStartedAt(performance.now());
      setStatus("loading");
      setError(null);
      setResponse(null);
      setActiveCitation(null);
      setSubmittedQuery(trimmed);

      try {
        const result = await postQuery(trimmed, controller.signal);
        setResponse(result);
        setStatus("success");
      } catch (caught) {
        const apiError = toApiError(caught);
        if (apiError.detail === "cancelled") return;
        setError(apiError);
        setStatus("error");
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [],
  );

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setQuestion("");
    setSubmittedQuery("");
    setResponse(null);
    setError(null);
    setStatus("idle");
    setActiveCitation(null);
    setValidationMessage(null);
  }, []);

  const handleCitationActivate = useCallback((index: number) => {
    setActiveCitation((current) => (current === index ? null : index));
    setSourcesOpenOnMobile(true);
  }, []);

  const sources = useMemo(
    () => (response ? buildAnswerSources(response) : []),
    [response],
  );

  const hasSources = sources.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[2rem]">
          Query workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">
          Ask a question about the indexed corpus. The backend runs dense and sparse
          retrieval, fuses both lists with reciprocal rank fusion, reranks with a
          cross-encoder, and generates an answer cited back to the chunks it was given.
        </p>
        <p className="mt-3 font-mono text-xs text-fg-faint">
          {IS_API_CONFIGURED ? API_BASE_URL : "no backend origin configured"}
          {IS_USING_DEV_FALLBACK ? " (development fallback)" : null}
        </p>
      </header>

      <QueryInput
        value={question}
        onChange={(value) => {
          setQuestion(value);
          if (validationMessage) setValidationMessage(null);
        }}
        onSubmit={() => runQuery(question)}
        onClear={handleClear}
        isSubmitting={status === "loading"}
        validationMessage={validationMessage}
        canClear={question.length > 0 || status !== "idle"}
      />

      <div className="mt-8">
        {!IS_API_CONFIGURED ? (
          <StateMessage
            tone="error"
            title="Query service address is not set"
            description="This build has no backend origin configured, so it cannot reach the retrieval API."
            hint="Set NEXT_PUBLIC_BACKEND_URL to the FastAPI origin and rebuild."
          />
        ) : corpusIsEmpty && status === "idle" ? (
          <StateMessage
            tone="neutral"
            title="No documents are indexed"
            description="The corpus is empty, so retrieval has nothing to search. Run the ingestion pipeline against a folder of documents, then reload this page."
            hint="POST /ingest"
          />
        ) : status === "idle" ? (
          <section
            aria-labelledby="examples-heading"
            className="rounded-card border border-border bg-surface p-5 sm:p-6"
          >
            <h2 id="examples-heading" className="text-sm font-semibold tracking-tight text-fg">
              Start with a question
            </h2>
            <p className="mt-1.5 text-xs text-fg-faint">
              These are answerable from the indexed corpus.
            </p>
            <ul className="mt-4 space-y-2">
              {EXAMPLE_QUERIES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion(example);
                      void runQuery(example);
                    }}
                    className={cn(
                      buttonSecondary,
                      "w-full justify-start px-3 py-2 text-left text-sm",
                    )}
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : status === "loading" ? (
          <PipelineIndicator elapsedMs={elapsedMs} />
        ) : status === "error" && error ? (
          <StateMessage
            tone="error"
            title={error.copy.title}
            description={error.copy.description}
            actionLabel={error.copy.action}
            onAction={() => {
              if (error.kind === "invalid-query") {
                setStatus("idle");
                return;
              }
              void runQuery(submittedQuery || question);
            }}
          />
        ) : response && !hasSources ? (
          <StateMessage
            tone="neutral"
            title="No chunks were retrieved for this question"
            description="Retrieval returned nothing above the relevance floor, so there is no evidence to ground an answer. Try wording the question with terms that appear in the corpus."
            actionLabel="Try again"
            onAction={() => void runQuery(submittedQuery)}
          />
        ) : response ? (
          <Reveal className="space-y-8">
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8">
              {/*
                The answer stays pinned while the evidence column scrolls, so
                a citation and the chunk it points at can be read together.
              */}
              <div className="min-w-0 lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto scrollbar-thin">
                <AnswerPanel
                  answer={response.answer}
                  sources={sources}
                  model={response.model}
                  activeIndex={activeCitation}
                  onCitationActivate={handleCitationActivate}
                />
              </div>

              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSourcesOpenOnMobile((open) => !open)}
                  aria-expanded={sourcesOpenOnMobile}
                  aria-controls="sources-region"
                  className={cn(buttonSecondary, "w-full justify-between lg:hidden")}
                >
                  <span>
                    Evidence
                    <span className="ml-2 font-mono text-xs text-fg-faint">
                      {sources.length} chunks
                    </span>
                  </span>
                  <span aria-hidden="true" className="font-mono text-xs">
                    {sourcesOpenOnMobile ? "hide" : "show"}
                  </span>
                </button>

                <div
                  id="sources-region"
                  className={cn(
                    "mt-4 lg:mt-0 lg:block",
                    sourcesOpenOnMobile ? "block" : "hidden",
                  )}
                >
                  <SourcePanel
                    sources={sources}
                    activeIndex={activeCitation}
                    onSelect={setActiveCitation}
                    documentTitles={documentTitles}
                  />
                </div>
              </div>
            </div>

            <ComparisonPanel query={submittedQuery} documentTitles={documentTitles} />
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
