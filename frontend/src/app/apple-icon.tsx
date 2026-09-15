import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The HybridRAG mark at touch-icon size: two paths converging into one node. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0E14",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <path
            d="M5 7 C 14 7, 14 16, 19 16"
            stroke="#5B8CFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M5 25 C 14 25, 14 16, 19 16"
            stroke="#5B8CFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.65"
          />
          <circle cx="23" cy="16" r="5" fill="#5B8CFF" />
        </svg>
      </div>
    ),
    size,
  );
}
