import { describe, expect, it } from "vitest";
import { collapsePalette, simplifyTokenKey } from "../lib.js";

describe("collapsePalette", () => {
  it("makes palette flat", () => {
    const palette = {
      Colors: {
        Primary: {
          "Light 100": {
            $type: "color",
            $value: "#fff000",
          },
          "Light 200": {
            $type: "color",
            $value: "#000fff",
          },
        },
        Secondary: {
          Gray: {
            100: {
              $type: "color",
              $value: "#ff0000",
            },
          },
        },
      },
    };
    // @ts-ignore
    const res = collapsePalette(palette);

    expect(res).toEqual({
      "Colors.Primary.Light 100": {
        $type: "color",
        $value: "#fff000",
      },
      "Colors.Primary.Light 200": {
        $type: "color",
        $value: "#000fff",
      },
      "Colors.Secondary.Gray.100": {
        $type: "color",
        $value: "#ff0000",
      },
    });
  });
});

describe("simplifyTokenKey", () => {
  it("simplifies token key for next use of it", () => {
    expect(simplifyTokenKey("Foo Bar Baz")).toBe("foo-bar-baz");
    expect(simplifyTokenKey("Foo.Bar-Baz.Beep")).toBe("foo-bar-baz-beep");
    expect(simplifyTokenKey("measurements.gap.32_|_24")).toBe("measurements-gap-32-24");
  });
});
