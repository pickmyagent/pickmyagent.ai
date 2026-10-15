/** Satori-safe robot head for generated icons and the Open Graph image. */
export function RobotFace({ size }: { size: number }) {
  const gold =
    "linear-gradient(145deg, #f7e8bc 0%, #e8c56a 46%, #c4922a 100%)";
  const eye = Math.max(4, Math.round(size * 0.18));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#07090f",
      }}
    >
      <div
        style={{
          width: Math.max(4, Math.round(size * 0.16)),
          height: Math.max(4, Math.round(size * 0.16)),
          marginTop: Math.round(size * 0.04),
          borderRadius: 999,
          backgroundImage: gold,
          display: "flex",
        }}
      />
      <div
        style={{
          width: Math.max(2, Math.round(size * 0.07)),
          height: Math.round(size * 0.1),
          backgroundImage: gold,
          display: "flex",
        }}
      />
      <div
        style={{
          width: Math.round(size * 0.82),
          height: Math.round(size * 0.56),
          borderRadius: Math.round(size * 0.2),
          backgroundImage: gold,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(size * 0.1),
        }}
      >
        <div
          style={{
            width: eye,
            height: eye,
            borderRadius: Math.max(2, Math.round(size * 0.05)),
            backgroundColor: "#07090f",
            display: "flex",
          }}
        />
        <div
          style={{
            width: eye,
            height: eye,
            borderRadius: Math.max(2, Math.round(size * 0.05)),
            backgroundColor: "#07090f",
            display: "flex",
          }}
        />
      </div>
    </div>
  );
}
