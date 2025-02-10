import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {import("prettier").Options} */
export default {
  trailingComma: "all",
  singleQuote: false,
  arrowParens: "always",
  plugins: [require.resolve("@trivago/prettier-plugin-sort-imports"), require.resolve("prettier-plugin-packagejson")],
  printWidth: 120,
  importOrder: ["allure", "^@allure/(.*)$", "app/(.*)$", "^[./]"],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ["typescript", "decorators-legacy"],
  quoteProps: "consistent",
};
