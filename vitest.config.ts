import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/fixtures/**", "evals/**"],
    // Pins ULTRAGUARD_HOME to a throwaway directory: the suite must never read
    // or write a user's watch state.
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/vendor/**"],
      reporter: ["text-summary", "text"],
    },
  },
});
