import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "onnxruntime-web", "sharp"],
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": { browser: "./lib/empty-module.ts" },
      sharp: { browser: "./lib/empty-module.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/methodology",
        destination: "/how-we-test",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
