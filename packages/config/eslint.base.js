import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Shared lint rules for the API and shared packages. The mobile app uses eslint-config-expo.
 * @param {string} tsconfigRootDir directory of the package being linted
 */
export function baseConfig(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ['dist', '.wrangler', 'drizzle', 'worker-configuration.d.ts', 'eslint.config.js'] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  );
}
