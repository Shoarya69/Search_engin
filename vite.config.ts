import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const opensearchTarget = env.OPENSEARCH_URL || env.VITE_OPENSEARCH_URL;
  const nlpTarget = env.NLP_API_URL || "http://127.0.0.1:8765";

  const proxy: Record<string, object> = {};
  if (opensearchTarget?.startsWith("http")) {
    proxy["/opensearch"] = {
      target: opensearchTarget,
      changeOrigin: true,
      secure: env.OPENSEARCH_INSECURE !== "true",
      rewrite: (path: string) => path.replace(/^\/opensearch/, ""),
    };
  }
  if (nlpTarget.startsWith("http")) {
    proxy["/nlp"] = {
      target: nlpTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/nlp/, ""),
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    server: Object.keys(proxy).length ? { proxy } : undefined,
  };
});
