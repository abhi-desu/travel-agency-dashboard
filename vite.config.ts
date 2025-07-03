import { reactRouter } from "@react-router/dev/vite";
import {
  sentryReactRouter,
  type SentryReactRouterBuildOptions,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "toshiro",
  project: "travel-agency",
  // An auth token is required for uploading source maps.
  authToken:
    "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",
  // ...
};

export default defineConfig((config) => {
  return {
    plugins: [
      tailwindcss(),
      tsconfigPaths(),
      reactRouter(),
      sentryReactRouter(sentryConfig, config),
    ],
    ssr: { noExternal: [/@syncfusion/] },
  };
});
