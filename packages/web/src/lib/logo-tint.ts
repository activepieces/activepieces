import { tryCatchSync } from '@activepieces/core-utils';
import { useEffect, useState } from 'react';

const SAMPLE_SIZE = 24;
const MIN_ALPHA = 128;
const MIN_PIXEL_CHROMA = 0.04;
const MIN_COLOURED_SHARE = 0.08;
const TINT_LIGHTNESS = 96.5;
const TINT_CHROMA = 0.022;
const FAILED_LOAD_RETRY_MS = 5 * 60 * 1000;

const resolved = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();
const failedAt = new Map<string, number>();

function useLogoTint({
  src,
  enabled,
}: {
  src: string | undefined;
  enabled: boolean;
}): string | null {
  const [loaded, setLoaded] = useState<LoadedTint | null>(null);

  useEffect(() => {
    if (!src || !enabled || resolved.has(src)) {
      return;
    }
    let live = true;
    tintFor({ src })
      .then((color) => {
        if (live) {
          setLoaded({ src, color });
        }
      })
      .catch(() => {
        if (live) {
          setLoaded({ src, color: null });
        }
      });
    return () => {
      live = false;
    };
  }, [src, enabled]);

  if (!src || !enabled) {
    return null;
  }
  if (resolved.has(src)) {
    return resolved.get(src) ?? null;
  }
  return loaded?.src === src ? loaded.color : null;
}

function tintFor({ src }: { src: string }): Promise<string | null> {
  if (resolved.has(src)) {
    return Promise.resolve(resolved.get(src) ?? null);
  }
  const existing = pending.get(src);
  if (existing) {
    return existing;
  }
  if (failedRecently({ src })) {
    return Promise.resolve(null);
  }
  const promise = loadImage({ src })
    .then((image) => {
      const { data } = tryCatchSync(() =>
        tintFromPixels({ pixels: samplePixels({ image }) }),
      );
      const color = data ?? null;
      failedAt.delete(src);
      resolved.set(src, color);
      return color;
    })
    .catch(() => {
      failedAt.set(src, Date.now());
      return null;
    })
    .finally(() => pending.delete(src));
  pending.set(src, promise);
  return promise;
}

function failedRecently({ src }: { src: string }): boolean {
  const at = failedAt.get(src);
  return at !== undefined && Date.now() - at < FAILED_LOAD_RETRY_MS;
}

function loadImage({ src }: { src: string }): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`failed to load ${src}`));
    image.src = src;
  });
}

function samplePixels({
  image,
}: {
  image: HTMLImageElement;
}): Uint8ClampedArray | null {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return null;
  }
  context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
}

function tintFromPixels({
  pixels,
}: {
  pixels: Uint8ClampedArray | null;
}): string | null {
  if (!pixels) {
    return null;
  }
  const visible = Array.from({ length: pixels.length / 4 }, (_, index) => ({
    red: pixels[index * 4],
    green: pixels[index * 4 + 1],
    blue: pixels[index * 4 + 2],
    alpha: pixels[index * 4 + 3],
  })).filter(({ alpha }) => alpha >= MIN_ALPHA);
  if (visible.length === 0) {
    return null;
  }
  const coloured = visible
    .map((pixel) => toOklab(pixel))
    .map(({ a, b }) => ({ a, b, chroma: Math.hypot(a, b) }))
    .filter(({ chroma }) => chroma >= MIN_PIXEL_CHROMA);
  if (coloured.length / visible.length < MIN_COLOURED_SHARE) {
    return null;
  }
  const sum = coloured.reduce(
    (total, { a, b, chroma }) => ({
      a: total.a + a * chroma,
      b: total.b + b * chroma,
    }),
    { a: 0, b: 0 },
  );
  if (Math.hypot(sum.a, sum.b) === 0) {
    return null;
  }
  const hue = (Math.atan2(sum.b, sum.a) * 180) / Math.PI;
  return `oklch(${TINT_LIGHTNESS}% ${TINT_CHROMA} ${((hue + 360) % 360).toFixed(
    1,
  )})`;
}

function toOklab({
  red,
  green,
  blue,
}: {
  red: number;
  green: number;
  blue: number;
}): { a: number; b: number } {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export const logoTint = {
  useLogoTint,
  tintFromPixels,
};

type LoadedTint = {
  src: string;
  color: string | null;
};
