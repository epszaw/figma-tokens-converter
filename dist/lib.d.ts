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
export declare const linkValueRe: RegExp;
export declare const collapsePalette: (palette: Palette) => Palette;
export declare const detokenizePalette: (palette: Palette) => {};
export declare const delinkValue: (value: string, palette: CompiledPalette) => string | string[];
export declare const delinkCssRule: (rule: string, palette: CompiledPalette) => string;
export declare const delinkCompiledPalette: (palette: CompiledPalette) => CompiledPalette;
export declare const omitUndefinedTokens: (palette: CompiledPalette) => import("lodash").Dictionary<any>;
export declare const extractPrimitiveTokenValue: (token: PrimitiveToken) => string;
export declare const extractTypographyTokenValue: (token: TypographyToken) => string[];
export declare const extractShadowTokenValue: (token: ShadowToken) => string;
export declare const extractGradientTokenValue: (token: GradientToken) => string;
export declare const extractStringTokenValue: (token: PrimitiveToken) => string;
export declare const extractTokenValue: (token: Token) => string | string[];
export declare const simplifyTokenKey: (key: string) => Lowercase<string>;
export declare const paletteToCssUtils: (palette: CompiledPalette) => string;
export declare const paletteToCssVariables: (palette: CompiledPalette) => string;
export declare const compileMappedPalettes: (palettes: Record<string, Palette>) => import("lodash").Dictionary<any>;
export declare const readPalette: (inputPath: string, palettePath: string) => any;
export declare const readManifestPalettes: (inputPath: string, palettes: Record<string, string[]>) => any;
