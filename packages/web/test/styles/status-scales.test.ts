import fs from 'node:fs';
import path from 'node:path';

import { brandColors } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

const STYLES = fs.readFileSync(
  path.resolve(__dirname, '../../src/styles.css'),
  'utf8',
);
const THEMES = {
  light: themeBlock({ opening: ":root,\n  [data-theme='light'] {" }),
  dark: themeBlock({ opening: "[data-theme='dark'] {" }),
};
const BRAND_HUE = Number(rootValue({ name: '--brand-h' }));
const HUES = Array.from({ length: 72 }, (_, index) => index * 5);
const CHROMA_SCALES = [0.4, 1];
const AA_TEXT_RATIO = 4.5;

describe('status scales', () => {
  Object.entries(THEMES).forEach(([theme, block]) => {
    brandColors.statusScales.forEach((scale) => {
      it(`keeps ${scale} step 11 readable at every seeded hue in ${theme} mode`, () => {
        const ink = step({ block, scale, step: 11 });
        const failures = HUES.flatMap((hue) =>
          CHROMA_SCALES.flatMap((chromaScale) =>
            groundsFor({ block, theme, scale, hue, chromaScale })
              .map((ground) => ({
                ground: ground.name,
                ratio: contrast({
                  first: toSrgb({
                    lightness: ink.lightness,
                    chroma: ink.chroma * chromaScale,
                    hue,
                  }),
                  second: ground.srgb,
                }),
              }))
              .filter(({ ratio }) => ratio < AA_TEXT_RATIO)
              .map(
                ({ ground, ratio }) =>
                  `hue ${hue}, chroma ×${chromaScale}, on ${ground}: ${ratio.toFixed(
                    2,
                  )}:1`,
              ),
          ),
        );
        expect(failures).toEqual([]);
      });
    });
  });

  it('defaults each status hue to the hue of its default solid', () => {
    brandColors.statusScales.forEach((scale) => {
      const seeded = brandColors.statusCssVariables({
        statusColors: { [scale]: brandColors.defaultStatusColor({ scale }) },
      });
      expect(Number(seeded[`--${scale}-h`])).toBeCloseTo(
        Number(rootValue({ name: `--${scale}-h` })),
        0,
      );
      expect(rootValue({ name: `--${scale}-c` })).toBe('1');
    });
  });
});

function groundsFor({
  block,
  theme,
  scale,
  hue,
  chromaScale,
}: {
  block: string;
  theme: string;
  scale: string;
  hue: number;
  chromaScale: number;
}): Ground[] {
  const grays = [1, 2, 3].map((number) => {
    const gray = step({ block, scale: 'gray', step: number });
    return {
      name: `gray-${number}`,
      srgb: toSrgb({ ...gray, hue: BRAND_HUE }),
    };
  });
  const tint = step({ block, scale, step: 3 });
  const ownTint = {
    name: `${scale}-3`,
    srgb: toSrgb({
      lightness: tint.lightness,
      chroma: tint.chroma * chromaScale,
      hue,
    }),
  };
  const panel = theme === 'light' ? [{ name: 'panel', srgb: WHITE }] : [];
  return [...grays, ownTint, ...panel];
}

function step({
  block,
  scale,
  step: number,
}: {
  block: string;
  scale: string;
  step: number;
}): { lightness: number; chroma: number } {
  const match = block.match(
    new RegExp(
      `--${scale}-${number}: (?:var\\(--${scale}-seed, )?oklch\\(([\\d.]+)% calc\\(([\\d.]+) \\*`,
    ),
  );
  if (!match) {
    throw new Error(`--${scale}-${number} is not a seedable oklch step`);
  }
  return { lightness: Number(match[1]) / 100, chroma: Number(match[2]) };
}

function themeBlock({ opening }: { opening: string }): string {
  const start = STYLES.indexOf(opening);
  if (start === -1) {
    throw new Error(`no theme block opening with ${opening}`);
  }
  return STYLES.slice(start, STYLES.indexOf('\n  }', start));
}

function rootValue({ name }: { name: string }): string {
  const match = STYLES.match(new RegExp(`:root \\{[^}]*?${name}: ([^;]+);`));
  if (!match) {
    throw new Error(`${name} is not set on :root`);
  }
  return match[1].trim();
}

function toSrgb({
  lightness,
  chroma,
  hue,
}: {
  lightness: number;
  chroma: number;
  hue: number;
}): Srgb {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel)));
}

function contrast({ first, second }: { first: Srgb; second: Srgb }): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance([red, green, blue]: Srgb): number {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

const WHITE: Srgb = [1, 1, 1];

type Srgb = number[];

type Ground = {
  name: string;
  srgb: Srgb;
};
