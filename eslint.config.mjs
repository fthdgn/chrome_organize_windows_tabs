import js from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"

/** Globals defined in src/shared/ and loaded via script tags or importScripts */
const sharedGlobals = {
  actions: "readonly",
  options: "readonly",
  utils: "readonly",
}

export default tseslint.config(
  js.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        chrome: "readonly",
        importScripts: "readonly",
        ...sharedGlobals,
      },
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "prefer-const": "error",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  {
    ignores: ["node_modules/", ".cache/"],
  },
)
