// @ts-check
import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'packages/database/src/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Design-system guardrail: no inline style objects outside the ui package.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'Use design tokens / Tailwind utilities instead of inline styles.',
        },
      ],
      // Enforce module boundaries: features may not import other features' internals.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@pocketnexus/*/src/*'],
              message: 'Import from the package entry point, not its internals.',
            },
            {
              group: ['**/features/*/*', '!**/features/*/index'],
              message: 'Import other features via their index.ts public API only.',
            },
          ],
        },
      ],
    },
  },
  {
    // Tooling and config files run in Node and are not part of the typed project.
    files: ['**/*.{js,mjs,cjs}', '**/*.config.{js,ts}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/e2e/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-imports': 'off',
    },
  },
);
