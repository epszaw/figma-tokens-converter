import {
  concat,
  filter,
  flatMap,
  flow,
  fromPairs,
  identity,
  isArray,
  join,
  kebabCase,
  keys,
  map,
  mapKeys,
  reduce,
  replace,
  sortBy,
  toLower,
  toPairs,
  union,
  values,
} from "lodash/fp";
import { join as joinPath } from "node:path"
import { readFileSync } from "node:fs";

export type TokensCollection = {
  modes: Record<string, string[]>;
};

export type TokensManifest = {
  collections: Record<string, TokensCollection>;
  styles: Record<string, string[]>;
};

export type TypographyTokenValue = Record<string, string | number>;

export type PrimitiveTokenValue = string;

export type ShadowDefinition = {
  offsetX: string;
  offsetY: string;
  spread: string;
  blur: string;
  color: string;
};

export type ShadowTokenValue = ShadowDefinition[];

export type GradientTokenValue = {
  type: "linear";
  angle: number;
  stops: {
    color: string;
    position: number;
  }[];
};

export type BaseToken<T = string, K = any> = {
  $type: T;
  $value: K;
};

export type TypographyToken = BaseToken<"typography", TypographyTokenValue>;

export type ShadowToken = BaseToken<"shadow", ShadowTokenValue>;

export type GradientToken = BaseToken<"gradient", GradientTokenValue>;

export type PrimitiveToken = BaseToken<"color" | "dimension" | "string" | "boolean", PrimitiveTokenValue>;

export type Token = TypographyToken | ShadowToken | GradientToken | PrimitiveToken;

export type Palette = {
  [x: string]: Token | Palette;
};

export type CompiledPalette = {
  [x: string]: string | string[];
};

export const linkValueRe = /\{(?<value>.+)}/;

export const collapsePalette = (palette: Palette) => {
  const iterator = (palette: Palette, path?: string) => {
    let res: Palette = {};

    Object.keys(palette).forEach((key) => {
      const newPath = path ? `${path}.${key}` : key;
      const token = palette[key];

      if (!token.$type) {
        res = {
          ...res,
          ...iterator(token as Palette, newPath),
        };
        return;
      }

      res[newPath] = palette[key];
    });

    return res;
  };

  return iterator(palette);
};

export const detokenizePalette = (palette: Palette) =>
  flow(
    keys,
    reduce((acc, key) => {
      const value = extractTokenValue(palette[key] as Token);

      return {
        ...acc,
        [key]: value,
      };
    }, {}),
  )(palette);

export const delinkValue = (value: string, palette: CompiledPalette) => {
  const { value: linkKey } = linkValueRe.exec(value)?.groups || {};

  if (!linkKey) {
    return value;
  }

  const linkedValue = palette[linkKey];

  if (linkKey && !linkedValue) {
    console.warn(`Can't find link value for key "${linkKey}"`);
  }

  return linkedValue || value;
};

export const delinkCssRule = (rule: string, palette: CompiledPalette) => {
  const [key, value] = rule.split(":").map((v) => v.trim());
  const linkedValue = delinkValue(value, palette);

  return `${key}: ${linkedValue}`;
};

export const delinkCompiledPalette = (palette: CompiledPalette) => {
  return flow(
    toPairs,
    sortBy(([, value]) => {
      if (Array.isArray(value)) {
        return false;
      }

      return linkValueRe.test(value);
    }),
    reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        return {
          ...acc,
          [key]: value.map((rule) => delinkCssRule(rule, acc)),
        };
      }

      return {
        ...acc,
        [key]: delinkValue(value, acc),
      };
    }, {} as CompiledPalette),
  )(palette);
};

export const omitUndefinedTokens = (palette: CompiledPalette) =>
  flow(
    toPairs,
    filter(([, value]) => {
      if (Array.isArray(value)) {
        return true;
      }

      return String(value) !== "undefined";
    }),
    fromPairs,
  )(palette);

export const extractPrimitiveTokenValue = (token: PrimitiveToken): string => token.$value;

export const extractTypographyTokenValue = (token: TypographyToken): string[] =>
  flow(
    mapKeys((key: string) => kebabCase(key)),
    toPairs,
    reduce((acc, [key, value]) => acc.concat(`${key}: ${value}`), [] as string[]),
  )(token.$value);

export const extractShadowTokenValue = (token: ShadowToken): string =>
  flow(
    map((value: ShadowDefinition) => {
      const { offsetX, offsetY, spread, blur, color } = value;

      return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
    }),
    join(", "),
  )(token.$value as ShadowTokenValue);

export const extractGradientTokenValue = (token: GradientToken) => {
  const { angle, stops } = token.$value;
  const colors = flow(
    sortBy(({ position }) => position),
    map(({ color }) => color),
    join(", "),
  )(stops);

  return `linear-gradient(${angle}deg, ${colors})`;
};

export const extractStringTokenValue = (token: PrimitiveToken) => {
  // match font-weight figma values due to the fact that they aren't compatible with css
  switch (token.$value) {
    case "Regular":
      return "400";
    case "Medium":
      return "500";
    case "SemiBold":
      return "600";
    case "Bold":
      return "700";
    case "ExtraBold":
      return "800";
    case "Black":
      return "900";
  }

  return token.$value;
};

export const extractTokenValue = (token: Token) => {
  switch (token.$type) {
    case "typography":
      return extractTypographyTokenValue(token);
    case "shadow":
      return extractShadowTokenValue(token);
    case "color":
    case "dimension":
      return extractPrimitiveTokenValue(token);
    case "gradient":
      return extractGradientTokenValue(token);
    case "string":
      return extractStringTokenValue(token);
    case "boolean":
      break;
    default:
      console.warn(`Unsupported token type: "${(token as BaseToken).$type}"`);
      return undefined;
  }
};

export const simplifyTokenKey = (key: string) => flow(replace(/(\s|\.)/g, "-"), replace("_|_", "-"), toLower)(key);

export const paletteToCssUtils = (palette: CompiledPalette) => {
  const palettePairs = flow(
    toPairs,
    map(([key, value]) => [simplifyTokenKey(key), value]),
  )(palette);

  return flow(
    filter(([, value]) => isArray(value)),
    map(([key, value]) => [key, value.map((rule) => `  ${rule}`).join(";\n")]),
    reduce((acc, [key, value]) => acc.concat(`.${key} {\n${value};\n}`), [] as string[]),
    join("\n\n"),
  )(palettePairs);
};

export const paletteToCssVariables = (palette: CompiledPalette) => {
  const palettePairs = flow(
    toPairs,
    map(([key, value]) => [simplifyTokenKey(key), value]),
  )(palette);

  return flow(
    filter(([, value]) => !isArray(value)),
    reduce((acc, [key, value]) => acc.concat(`  --${key}: ${value};`), [] as string[]),
    join("\n"),
    concat([":root {"]),
    union(["}"]),
    join("\n"),
  )(palettePairs);
};

export const compileMappedPalettes = (palettes: Record<string, Palette>) =>
  flow(collapsePalette, detokenizePalette, delinkCompiledPalette, omitUndefinedTokens)(palettes);

export const readPalette = (inputPath: string, palettePath: string) => {
  const filePath = joinPath(inputPath, palettePath);
  const fileSrc = readFileSync(filePath, "utf8");

  return JSON.parse(fileSrc);
};

export const readManifestPalettes = (inputPath: string, palettes: Record<string, string[]>) =>
  flow(
    values,
    flatMap(identity),
    map((file) => readPalette(inputPath, file)),
    reduce((acc, palette) => Object.assign(acc, palette), {}),
  )(palettes);
