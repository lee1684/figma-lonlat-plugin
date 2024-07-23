module.exports = {
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: [
    'prettier',
    'react',
    '@typescript-eslint',
    'testing-library',
    'react-hooks',
  ],
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'prettier/prettier': 'off',
    'no-plusplus': 'off',
    '@typescript-eslint/no-shadow': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react/jsx-filename-extension': [
      1,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    'no-restricted-globals': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-param-reassign': [
      'error',
      { props: true, ignorePropertyModificationsForRegex: ['^draft'] },
    ],
    'import/extensions': ['off'],
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react/function-component-definition':[
      2, 
      {
        "namedComponents": [
        "arrow-function", 
        "function-declaration"
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
  ignorePatterns: ['node_modules/', 'dist', '**/*.js', 'setupTests.ts'],
};
