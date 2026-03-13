import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.eslintrc.js', 'coverage/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        node: true,
        jest: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: prettier,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...prettier.configs.recommended.rules,

      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'off',
      'prefer-template': 'error',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-else-return': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',

      'object-shorthand': ['error', 'always'],

      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-trailing-spaces': 'error',

      'no-confusing-arrow': 'off',
      'arrow-body-style': 'off',
      'arrow-parens': 'off',
    },
  },
];
