import type { Metadata } from "next";

import {
  ContactEmails,
  Detail,
  LegalPage,
  type LegalSection,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What HybridRAG collects when you submit a query, where that data goes, how long it is kept, and who processes it.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    heading: "Scope",
    body: (
      <>
        <p>
          This policy covers the HybridRAG demonstration application: the website and the
          query API behind it. HybridRAG is a technical demonstration of a
          retrieval-augmented generation pipeline, operated by{" "}
          <Detail name="operator" />.
        </p>
        <p>
          It does not cover any third-party website you reach from a link here, including
          the source code repository.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    heading: "Data we collect",
    body: (
      <>
        <p>
          There are no user accounts, so we do not collect names, email addresses,
          passwords or profile information. Specifically, we handle:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-fg-faint">
          <li>
            <strong className="font-medium text-fg">Query text.</strong> The question you
            type is sent to the backend so it can be embedded, matched against the corpus
            and answered.
          </li>
          <li>
            <strong className="font-medium text-fg">Request metadata.</strong> Standard
            server request information such as IP address, timestamp, requested path and
            user agent, recorded by the web server and the hosting provider.
          </li>
          <li>
            <strong className="font-medium text-fg">Browser storage.</strong> One session
            storage entry records that the introduction screen has already been shown, so
            it does not repeat. It contains no personal data, is not transmitted anywhere,
            and clears when you close the tab.
          </li>
        </ul>
        <p>
          We do not use advertising trackers, cross-site cookies or third-party analytics.
        </p>
      </>
    ),
  },
  {
    id: "use",
    heading: "How your data is used",
    body: (
      <>
        <p>
          Query text is used solely to produce an answer for that request: to compute an
          embedding, to run keyword search, and to form the prompt sent to the language
          model. Request metadata is used to operate and debug the service and to limit
          abuse.
        </p>
        <p>
          Query text is not used to train any model, is not sold, and is not shared with
          anyone other than the processors listed below.
        </p>
      </>
    ),
  },
  {
    id: "documents",
    heading: "Document and query data",
    body: (
      <>
        <p>
          The document corpus is supplied by the operator, not by visitors. There is no
          upload path exposed on this website. Documents are split into chunks, embedded,
          and stored alongside their text so that answers can cite them.
        </p>
        <p>
          The answers you see are generated from those chunks only. Do not submit
          confidential, personal or sensitive information in a query: query text leaves
          our infrastructure to reach the language model provider, as described below.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    heading: "Storage",
    body: (
      <>
        <p>
          The corpus, its chunks and their embeddings are stored in a hosted PostgreSQL
          database. Access to that database is limited to the backend service, which holds
          the only credential. The database is not reachable directly from the browser.
        </p>
        <p>
          Queries are not written to a database, and there is no per-visitor query history.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    heading: "Third-party services",
    body: (
      <>
        <p>These providers process data on our behalf:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-fg-faint">
          <li>
            <strong className="font-medium text-fg">Supabase</strong> hosts the PostgreSQL
            database holding documents, chunks and embeddings.
          </li>
          <li>
            <strong className="font-medium text-fg">OpenRouter</strong> routes the
            generation request to a language model provider. Your query text and the
            retrieved chunks are included in that request.
          </li>
          <li>
            <strong className="font-medium text-fg">Google Fonts</strong> serves the
            typefaces used on this site. Fonts are self-hosted at build time, so your
            browser does not contact Google while you browse.
          </li>
          <li>
            <strong className="font-medium text-fg">The hosting provider</strong> for the
            website and API, which keeps standard server logs.
          </li>
        </ul>
        <p>
          Each provider handles data under its own terms and privacy policy. Embedding and
          reranking run on our own infrastructure and involve no third party.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "Retention",
    body: (
      <>
        <p>
          Query text and generated responses are not persistently stored after a request
          is completed.
        </p>
        <p>
          Corpus documents and their embeddings remain available until explicitly deleted
          by the operator.
        </p>
        <p>
          Operational logs are retained only as necessary for service monitoring and
          debugging, and do not record query text or document content.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <>
        <p>
          Traffic is served over HTTPS. Database and model provider credentials are held
          server-side only and are never exposed to the browser. Row level security is
          enabled on the database tables, so they cannot be read directly even if the
          project URL is known. Write access to the corpus is not exposed publicly.
        </p>
        <p>
          No system is perfectly secure, and this is a demonstration project rather than a
          production service. It has not been audited or certified against any security or
          privacy standard, and no such compliance is claimed.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    heading: "Your choices",
    body: (
      <>
        <p>
          Because no accounts exist and queries are not stored, there is generally no
          personal record for us to retrieve, correct or delete. You can clear the single
          session storage entry at any time through your browser settings.
        </p>
        <p>
          If you believe request logs contain information relating to you and you want it
          removed, contact us at <ContactEmails /> and we will address the
          request where the logs are still within their retention window. Depending on
          where you live, local law may give you further rights over personal data.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        This policy may be updated as the project changes. The date at the top of this page
        reflects the most recent revision. Continued use of the service after an update
        means the revised policy applies.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        Questions about this policy can be sent to <ContactEmails />, or
        raised as an issue in the project repository linked in the footer.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="HybridRAG is a demonstration of a retrieval pipeline. It has no accounts and stores no query history. This page sets out exactly what is handled when you use it, where that data goes, and how long it is kept."
      sections={SECTIONS}
    />
  );
}
