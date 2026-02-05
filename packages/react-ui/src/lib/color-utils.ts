import { useQuery } from '@tanstack/react-query';
import { FastAverageColor } from 'fast-average-color';

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
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgUrl;
        return new Promise<string | null>((resolve) => {
          img.onload = () => {
            colorsUtils.fac
              .getColorAsync(img, { algorithm: 'simple' })
              .then((color) => {
                const [r, g, b] = color.value;
                if (colorsUtils.isGrayColor(r, g, b)) {
                  resolve(null);
                } else {
                  resolve(
                    `color-mix(in srgb, rgb(${r},${g},${b}) ${transparency}%, #fff 92%)`,
                  );
                }
              })
              .catch(() => {
                resolve(null);
              });
          };
        });
      },
    });
    return data;
  },
};
