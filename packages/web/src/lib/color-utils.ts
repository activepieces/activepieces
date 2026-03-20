import { useQuery } from '@tanstack/react-query';
import { FastAverageColor } from 'fast-average-color';

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });

  imageCache.set(url, promise);
  return promise;
}

function parseToHsl(hex: string) {
  // Remove the '#' character if it exists
  hex = hex.replace(/^#/, '');

  // Convert 3-digit hex to 6-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find the maximum and minimum values to get lightness
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;

    // Calculate saturation
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    // Calculate hue
    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      case b:
        hue = (r - g) / delta + 4;
        break;
    }

    hue /= 6;
  }

  // Convert hue to degrees
  hue = hue * 360;

  return {
    hue,
    saturation,
    lightness,
  };
}

function hexToHslString(hex: string) {
  const { hue, saturation, lightness } = parseToHsl(hex);
  return `${hue.toFixed(1)} ${(saturation * 100).toFixed(1)}% ${(
    lightness * 100
  ).toFixed(1)}%`;
}

export const colorsUtils = {
  hexToHslString,
  parseToHsl,
  isGrayColor: (r: number, g: number, b: number): boolean => {
    const threshold = 15;
    const darkThreshold = 150;
    const lightThreshold = 225;

    const isDark =
      r <= darkThreshold && g <= darkThreshold && b <= darkThreshold;
    const isLight =
      r >= lightThreshold && g >= lightThreshold && b >= lightThreshold;
    const diffRG = Math.abs(r - g);
    const diffRB = Math.abs(r - b);
    const diffGB = Math.abs(g - b);
    const isGray =
      diffRG <= threshold && diffRB <= threshold && diffGB <= threshold;
    return isDark || isLight || isGray;
  },
  fac: new FastAverageColor(),
  loadImage,
  useAverageColorInImage: ({
    imgUrl,
    transparency,
  }: {
    imgUrl: string;
    transparency: number;
  }) => {
    const { data } = useQuery({
      queryKey: ['averageColorInImage', imgUrl, transparency],
      queryFn: async () => {
        const img = await loadImage(imgUrl);
        const color = await colorsUtils.fac.getColorAsync(img, {
          algorithm: 'simple',
        });
        const [r, g, b] = color.value;
        if (colorsUtils.isGrayColor(r, g, b)) {
          return null;
        }
        return `color-mix(in srgb, rgb(${r},${g},${b}) ${transparency}%, #fff 92%)`;
      },
    });
    return data;
  },
};
