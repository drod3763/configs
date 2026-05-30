export default {
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "chore", "refactor", "test"],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 72],
  },
};
