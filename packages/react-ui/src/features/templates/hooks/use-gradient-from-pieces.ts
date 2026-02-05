import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadata, StepMetadata } from '@/lib/types';
import {
  FlowTrigger,
  flowStructureUtil,
  PieceCategory,
} from '@activepieces/shared';

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
};

const colorDistance = (c1: number[], c2: number[]): number => {
  return Math.sqrt(
    (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2,
  );
};

const shouldSkipPixel = (
  r: number,
  g: number,
  b: number,
  a: number,
): boolean => {
  if (a < 125) return true;
  if (r > 240 && g > 240 && b > 240) return true;
  if (r < 15 && g < 15 && b < 15) return true;
  return false;
};

const extractImagePixels = (img: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const maxPixels = 10000;
  const scale = Math.sqrt(maxPixels / (img.width * img.height));
  canvas.width = Math.floor(img.width * Math.min(scale, 1));
  canvas.height = Math.floor(img.height * Math.min(scale, 1));

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
};

const buildColorMap = (pixels: Uint8ClampedArray) => {
  const colorMap = new Map<string, { rgb: number[]; count: number }>();

  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [
      pixels[i],
      pixels[i + 1],
      pixels[i + 2],
      pixels[i + 3],
    ];

    if (shouldSkipPixel(r, g, b, a)) continue;

    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { rgb: [r, g, b], count: 1 });
    }
  }

  return colorMap;
};

const clusterSimilarColors = (
  colorMap: Map<string, { rgb: number[]; count: number }>,
) => {
  const sortedColors = Array.from(colorMap.entries()).sort(
    (a, b) => b[1].count - a[1].count,
  );
  const processed = new Set<string>();
  const clusters: Array<{ rgb: number[]; count: number }> = [];

  for (const [key, colorData] of sortedColors) {
    if (processed.has(key)) continue;

    const cluster = { rgb: colorData.rgb, count: colorData.count };
    processed.add(key);

    for (const [otherKey, otherData] of sortedColors) {
      if (processed.has(otherKey)) continue;
      if (colorDistance(colorData.rgb, otherData.rgb) < 51) {
        cluster.count += otherData.count;
        processed.add(otherKey);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
};

const extractColorsFromImage = async (imageUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const pixels = extractImagePixels(img);
        if (!pixels) {
          resolve([]);
          return;
        }

        const colorMap = buildColorMap(pixels);
        const clusters = clusterSimilarColors(colorMap);

        const topColors = clusters
          .sort((a, b) => b.count - a.count)
          .slice(0, 2)
          .map((cluster) =>
            rgbToHex(...(cluster.rgb as [number, number, number])),
          );

        resolve(topColors);
      } catch {
        resolve([]);
      }
    };

    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
};

const buildGradientFromColors = (colors: string[]): string => {
  if (colors.length === 0) return '';

  const uniqueColors = Array.from(new Set(colors)).slice(0, 4);

  if (uniqueColors.length === 1) {
    return `linear-gradient(135deg, ${uniqueColors[0]}15, ${uniqueColors[0]}30)`;
  }

  const gradientColors = uniqueColors.map((color) => `${color}20`).join(', ');
  return `linear-gradient(135deg, ${gradientColors})`;
};

export const useGradientFromPieces = (
  trigger: FlowTrigger | undefined,
  excludeCore = false,
) => {
  const steps = useMemo(
    () => (trigger ? flowStructureUtil.getAllSteps(trigger) : []),
    [trigger],
  );

  const stepsMetadataResults = stepsHooks.useStepsMetadata(steps);

  const stepsMetadata: StepMetadata[] = useMemo(
    () =>
      stepsMetadataResults
        .map((data) => data.data)
        .filter((data) => !!data) as StepMetadata[],
    [JSON.stringify(stepsMetadataResults.map((r) => r.dataUpdatedAt))],
  );

  const filteredMetadata = useMemo(
    () =>
      excludeCore
        ? stepsMetadata.filter((metadata) => {
            const pieceMetadata = metadata as PieceStepMetadata;
            return (
              !pieceMetadata.categories ||
              !pieceMetadata.categories.includes(PieceCategory.CORE)
            );
          })
        : stepsMetadata,
    [stepsMetadata, excludeCore],
  );

  const uniqueMetadata: StepMetadata[] = useMemo(
    () =>
      filteredMetadata.filter(
        (item, index, self) =>
          self.findIndex(
            (secondItem) => item.displayName === secondItem.displayName,
          ) === index,
      ),
    [filteredMetadata.map((m) => m.displayName).join(',')],
  );

  const logosToProcess = useMemo(
    () =>
      uniqueMetadata
        .slice(0, 4)
        .filter((metadata) => metadata.logoUrl)
        .map((metadata) => metadata.logoUrl),
    [uniqueMetadata],
  );

  const colorQueries = useQueries({
    queries: logosToProcess.map((logoUrl) => ({
      queryKey: ['logo-colors', logoUrl],
      queryFn: () => extractColorsFromImage(logoUrl),
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24,
      retry: false,
    })),
  });

  const gradient = useMemo(() => {
    if (logosToProcess.length === 0) {
      return '';
    }

    const allLoaded = colorQueries.every((query) => query.isSuccess);
    if (!allLoaded) {
      return '';
    }

    const allColors = colorQueries.map((query) => query.data || []).flat();

    return buildGradientFromColors(allColors);
  }, [colorQueries, logosToProcess.length]);

  return gradient;
};
