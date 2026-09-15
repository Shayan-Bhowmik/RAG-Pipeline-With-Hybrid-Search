import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "HybridRAG. Hybrid retrieval for grounded answers. Dense vector search and BM25 keyword search, fused, reranked, and cited.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0E14",
          padding: "72px",
          borderTop: "6px solid #5B8CFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <path
              d="M5 7 C 14 7, 14 16, 19 16"
              stroke="#5B8CFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M5 25 C 14 25, 14 16, 19 16"
              stroke="#5B8CFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />
            <circle cx="23" cy="16" r="4.5" fill="#5B8CFF" />
          </svg>
          <div style={{ fontSize: 34, color: "#E6E8EC", letterSpacing: "-0.02em" }}>
            HybridRAG
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              color: "#E6E8EC",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Hybrid retrieval for
          </div>
          <div
            style={{
              fontSize: 68,
              color: "#E6E8EC",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            grounded answers
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              color: "#8A8F98",
              lineHeight: 1.45,
              maxWidth: 880,
            }}
          >
            Dense vector search and BM25 keyword search, fused by reciprocal rank fusion,
            reranked by a cross-encoder, and cited back to the source chunks.
          </div>
        </div>

        <div style={{ display: "flex", gap: "28px", fontSize: 22, color: "#5C626D" }}>
          <div style={{ display: "flex" }}>pgvector</div>
          <div style={{ display: "flex" }}>BM25</div>
          <div style={{ display: "flex" }}>RRF</div>
          <div style={{ display: "flex" }}>cross-encoder</div>
        </div>
      </div>
    ),
    size,
  );
}
