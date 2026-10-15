import { ImageResponse } from "next/og";

export const alt = "PickMyAgent — find the AI agent that fits the job";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          backgroundColor: "#07090f",
          color: "#f4f6fb",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              border: "2px solid #d6f25c",
              color: "#d6f25c",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              marginRight: 16,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 4 }}>
            PICKMYAGENT
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1,
            maxWidth: 980,
          }}
        >
          Find the AI agent that fits the job.
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#c5cde0" }}>
          A short list. A check date. No invented ratings.
        </div>
      </div>
    ),
    { ...size },
  );
}
