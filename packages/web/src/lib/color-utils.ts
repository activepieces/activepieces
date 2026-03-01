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

export const colorsUtils = {
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
