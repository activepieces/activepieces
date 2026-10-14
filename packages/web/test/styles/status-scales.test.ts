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
const SCALES = ['accent', ...brandColors.statusScales] as const;

describe('colour scales in styles.css', () => {
  Object.entries(THEMES).forEach(([theme, block]) => {
    SCALES.forEach((scale) => {
      it(`matches the generated default ${scale} ramp in ${theme} mode`, () => {
        const ramp = brandColors.defaultRamp({ scale });
        const expected = theme === 'light' ? ramp.light : ramp.dark;
        brandColors.steps.forEach((step) => {
          expect(stepValue({ block, scale, step })).toEqual({
            override: `--${scale}-${theme}-${step}`,
            fallback: expected[step],
          });
        });
      });
    });

    brandColors.statusScales.forEach((scale) => {
      it(`labels the default ${scale} solid with its measured colour in ${theme} mode`, () => {
        const match = block.match(
          new RegExp(`--on-${scale}: var\\(--on-${scale}-seed, ([^)]+)\\);`),
        );
        expect(match?.[1]).toBe(brandColors.defaultRamp({ scale }).onSolid);
      });
    });
  });
});

describe('swatches in styles.css', () => {
  Object.entries(THEMES).forEach(([theme, block]) => {
    it(`match the generated swatches in ${theme} mode`, () => {
      brandColors.swatches().forEach((swatch, index) => {
        const roles = theme === 'light' ? swatch.light : swatch.dark;
        Object.entries(roles).forEach(([role, value]) => {
          const match = block.match(
            new RegExp(`--swatch-${index + 1}-${role}: ([^;]+);`),
          );
          expect(match?.[1]).toBe(value);
        });
      });
    });
  });
});

function stepValue({
  block,
  scale,
  step,
}: {
  block: string;
  scale: string;
  step: number;
}): { override: string; fallback: string } {
  const match = block.match(
    new RegExp(`--${scale}-${step}: var\\((--[\\w-]+), ([^;]+)\\);`),
  );
  if (!match) {
    throw new Error(`--${scale}-${step} is not an overridable step`);
  }
  return { override: match[1], fallback: match[2] };
}

function themeBlock({ opening }: { opening: string }): string {
  const start = STYLES.indexOf(opening);
  if (start === -1) {
    throw new Error(`no theme block opening with ${opening}`);
  }
  return STYLES.slice(start, STYLES.indexOf('\n  }', start));
}
