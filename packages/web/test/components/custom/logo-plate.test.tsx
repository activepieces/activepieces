/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { LogoPlate, LogoPlateProps } from '@/components/custom/logo-plate';
import { logoTint } from '@/lib/logo-tint';

const SRC = 'https://cdn.example.com/slack.png';

let container: HTMLDivElement;
let root: Root;

function render(props: LogoPlateProps) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<LogoPlate {...props} />);
  });
  return container;
}

function pixels({
  colours,
}: {
  colours: Array<{ rgba: [number, number, number, number]; count: number }>;
}): Uint8ClampedArray {
  return new Uint8ClampedArray(
    colours.flatMap(({ rgba, count }) =>
      Array.from({ length: count }, () => rgba).flat(),
    ),
  );
}

function hueOf({ tint }: { tint: string | null }): number {
  const match = tint?.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/);
  if (!match) {
    throw new Error(`not an oklch tint: ${tint}`);
  }
  return Number(match[3]);
}

describe('LogoPlate', () => {
  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders one logo and no tint by default', () => {
    render({ src: SRC, alt: 'Slack' });
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.firstElementChild?.getAttribute('style')).toBeNull();
  });

  it('never adds a second image when tinted', () => {
    render({ src: SRC, alt: 'Slack', tint: true });
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});

describe('logo tint', () => {
  it('gives black, grey and white logos no tint', () => {
    const tint = logoTint.tintFromPixels({
      pixels: pixels({
        colours: [
          { rgba: [0, 0, 0, 255], count: 40 },
          { rgba: [128, 128, 128, 255], count: 40 },
          { rgba: [255, 255, 255, 255], count: 40 },
        ],
      }),
    });
    expect(tint).toBeNull();
  });

  it('takes the hue of the coloured pixels, ignoring white and transparent ones', () => {
    const tint = logoTint.tintFromPixels({
      pixels: pixels({
        colours: [
          { rgba: [255, 255, 255, 255], count: 60 },
          { rgba: [0, 0, 0, 0], count: 200 },
          { rgba: [37, 99, 235, 255], count: 20 },
        ],
      }),
    });
    expect(hueOf({ tint })).toBeGreaterThan(255);
    expect(hueOf({ tint })).toBeLessThan(270);
  });

  it('tints a dark but colourful logo', () => {
    const tint = logoTint.tintFromPixels({
      pixels: pixels({
        colours: [
          { rgba: [74, 21, 75, 255], count: 30 },
          { rgba: [30, 30, 30, 255], count: 30 },
        ],
      }),
    });
    expect(tint).not.toBeNull();
  });

  it('ignores a speck of colour on a mostly neutral logo', () => {
    const tint = logoTint.tintFromPixels({
      pixels: pixels({
        colours: [
          { rgba: [20, 20, 20, 255], count: 98 },
          { rgba: [220, 38, 38, 255], count: 2 },
        ],
      }),
    });
    expect(tint).toBeNull();
  });

  it('uses the same light, low-chroma tint for every hue', () => {
    const red = logoTint.tintFromPixels({
      pixels: pixels({ colours: [{ rgba: [220, 38, 38, 255], count: 10 }] }),
    });
    const green = logoTint.tintFromPixels({
      pixels: pixels({ colours: [{ rgba: [22, 163, 74, 255], count: 10 }] }),
    });
    expect(red?.split(' ').slice(0, 2)).toEqual(green?.split(' ').slice(0, 2));
  });
});
