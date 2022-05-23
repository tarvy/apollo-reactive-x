module.exports = {
  extends: ["airbnb", "airbnb-typescript", "prettier"],
  root: true,
  rules: {
    "react/function-component-definition": [
      2,
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "no-underscore-dangle": "OFF",
  },
  parserOptions: {
    project: "./tsconfig.json",
  },
  ignorePatterns: [".eslintrc.js"],
};
