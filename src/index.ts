import { flow, keys, map } from "lodash/fp";
import minimist from "minimist";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  type TokensManifest,
  compileMappedPalettes,
  paletteToCssUtils,
  paletteToCssVariables,
  readManifestPalettes,
} from "./lib.js";

const convert = (process: NodeJS.Process) => {
  const args = process.argv.slice(2);
  const {
    output,
    themes,
    primitives,
    _: [input = ""],
  } = minimist(args);

  if (!output) {
    throw new Error("Output path is required! Provide it with --output flag");
  }

  if (!primitives) {
    throw new Error("Primitives key is required! Provide it with --theme flag");
  }

  if (!themes) {
    throw new Error("Themes key is required! Provide it with --theme flag");
  }

  const outputPath = resolve(output);
  const inputPath = resolve(input);
  const manifestSource = readFileSync(join(inputPath, "manifest.json"), "utf8");
  const { collections, styles: stylesCollection }: TokensManifest = JSON.parse(manifestSource);
  const primitivesCollections = collections[primitives].modes;
  const themesCollections = collections[themes].modes;
  const stylesTokens = readManifestPalettes(inputPath, stylesCollection);
  const primitivesTokens = readManifestPalettes(inputPath, primitivesCollections);

  mkdirSync(outputPath, { recursive: true });

  flow(
    keys,
    map((key) => ({ [key]: themesCollections[key] })),
    map((theme) => {
      const themeKey = keys(theme)[0].toLowerCase().replace(/\s/g, "-");
      const themeTokens = readManifestPalettes(inputPath, theme);
      const compiledPalette = compileMappedPalettes({
        ...themeTokens,
        ...stylesTokens,
        ...primitivesTokens,
      });
      const cssVariables = paletteToCssVariables(compiledPalette);
      const cssUtils = paletteToCssUtils(compiledPalette);

      writeFileSync(join(outputPath, `${themeKey}.css`), cssVariables, "utf8");
      writeFileSync(join(outputPath, `utils.css`), cssUtils, "utf8");
    }),
  )(themesCollections);
};

export default convert;
