import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // This app hydrates client state from localStorage and a custom
      // "tradeconnect_state_change" event inside useEffect — the only correct
      // place to do so (localStorage/window are unavailable during SSR).
      // React 19's set-state-in-effect rule flags this intentional pattern, so
      // we keep it visible as a warning rather than a build-blocking error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
