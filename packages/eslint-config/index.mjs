import tseslint from "typescript-eslint";

const config = tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      complexity: ["warn", { max: 10 }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
);

export default config;

export const testOverride = {
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
