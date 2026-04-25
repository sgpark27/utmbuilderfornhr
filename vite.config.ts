import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * VITE_CENTRAL_CHANNELS=1 이면 /api/* 는 Flask가 응답해야 합니다.
 * 로컬 개발: deploy/pythonanywhere 에서
 *   export FLASK_APP=app.py && flask run -p 5000
 * 후 npm run dev — 아래 proxy 가 /api 를 5000 으로 넘깁니다.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
