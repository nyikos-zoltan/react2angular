module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier/prettier',
  ],
  rules: {
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/no-empty-function': ['off'],
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'all',
        tabWidth: 2,
        semi: true,
        singleQuote: true,
        printWidth: 120,
        arrowParens: 'always',
      },
    ],
  },
};
