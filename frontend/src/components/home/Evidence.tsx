import { Section } from "@/components/site/Section";

const PRINCIPLES = [
  {
    title: "The model only sees retrieved text",
    body: "The system prompt instructs the model to answer from the provided chunks and nothing else. Prior knowledge is explicitly out of bounds, so an answer that is not in the corpus cannot be produced from memory.",
  },
  {
    title: "Not knowing is a valid answer",
    body: "When the retrieved context does not cover the question, the model is instructed to say so in fixed wording rather than construct something plausible. The interface renders that as its own state, next to the chunks that were considered.",
  },
  {
    title: "Every marker resolves to text",
    body: "Citation markers are parsed out of the answer and mapped back to the chunk at that position in the context window. Selecting one opens that chunk. A marker with no matching chunk is shown as unmatched rather than quietly dropped.",
  },
  {
    title: "The whole context window is visible",
    body: "The evidence panel lists all chunks the generator received, not only the cited ones. You can see what the model had available and chose not to use, which is what makes the citation count meaningful.",
  },
];

export function Evidence() {
  return (
    <Section
      id="evidence"
      eyebrow="Grounding"
      title="An answer you cannot check is not an answer"
      lead="Retrieval quality only matters if the output stays tied to what was retrieved. Four rules hold that line, in the prompt, in the API response, and in the interface."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((principle) => (
          <article key={principle.title} className="rounded-card border border-border bg-surface p-5">
            <h3 className="text-base font-semibold tracking-tight text-fg">{principle.title}</h3>
            <p className="mt-2.5 text-sm leading-7 text-fg-muted">{principle.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
