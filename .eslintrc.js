module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
    browser: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-restricted-syntax': 'off',
    'consistent-return': 'off',
    'max-len': ['warn', { code: 120, ignoreComments: true }],
    'no-param-reassign': ['error', { props: false }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.test.js', '**/*.spec.js'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-shadow': 'warn',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'no-cond-assign': ['error', 'except-parens'],
    'no-prototype-builtins': 'warn',
    'no-useless-escape': 'warn',
    'arrow-parens': ['warn', 'always'],
    'global-require': 'warn',
    'no-nested-ternary': 'warn',
    'no-template-curly-in-string': 'warn',
  },
};

// Made with Bob
