import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    viteReact(),
    // Nitro builds the server output for deployment; preset is pinned to
    // vercel since Nitro's SSR bundle needs a target-specific adapter and
    // auto-detection isn't reliable across all Vercel build environments.
    nitro({ preset: "vercel" }),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
