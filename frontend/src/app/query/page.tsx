import type { Metadata } from "next";

import { QueryWorkspace } from "@/components/workspace/QueryWorkspace";

export const metadata: Metadata = {
  title: "Query workspace",
  description:
    "Ask a question against the indexed corpus and see the grounded answer, the chunks it cites, and how dense, sparse, hybrid, and reranked retrieval differ for the same query.",
};

export default function QueryPage() {
  return (
    <main>
      <QueryWorkspace />
    </main>
  );
}
