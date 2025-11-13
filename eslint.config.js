import globals from "globals";

import { defineConfig, globalIgnores } from "eslint/config";

import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            importPlugin.flatConfigs.recommended,
            importPlugin.flatConfigs.typescript,
        ],
        rules: {
            "import/no-unresolved": "off",
            "import/order": [
                "warn",
                {
                    alphabetize: { order: "asc", caseInsensitive: true },
                    "newlines-between": "always",
                    groups: ["builtin", "external", "parent", "sibling", "index"],
                    pathGroups: [
                        { pattern: "@sashay/**", group: "external", position: "after" },
                        { pattern: "@/**", group: "parent", position: "before" },
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                },
            ],
        },
    },
    {
        files: ["apps/web/src/**/*.{ts,tsx}"],
        extends: [reactHooks.configs.flat["recommended-latest"], reactRefresh.configs.vite],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
]);
