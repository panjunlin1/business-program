import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      "@": "/src",        // 指向 src 目录
      "@static": "/static" // 指向 static 目录
    }
  }
});