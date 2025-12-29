import { FastAverageColor } from 'fast-average-color';
import React, { useState, useEffect, useRef } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithColorBackgroundProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  border?: boolean;
}

const isGrayColor = (r: number, g: number, b: number): boolean => {
  const threshold = 15;
  const darkThreshold = 150;
  const lightThreshold = 225;

  const isDark = r <= darkThreshold && g <= darkThreshold && b <= darkThreshold;
  const isLight =
    r >= lightThreshold && g >= lightThreshold && b >= lightThreshold;
  const diffRG = Math.abs(r - g);
  const diffRB = Math.abs(r - b);
  const diffGB = Math.abs(g - b);
  const isGray =
    diffRG <= threshold && diffRB <= threshold && diffGB <= threshold;
  return isDark || isLight || isGray;
};

const ImageWithColorBackground = ({
  src,
  alt,
  fallback,
  ...props
}: ImageWithColorBackgroundProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const fac = new FastAverageColor();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      fac
        .getColorAsync(img, { algorithm: 'simple' })
        .then((color) => {
          const [r, g, b] = color.value;
          if (isGrayColor(r, g, b)) {
            setBackgroundColor(null);
          } else {
            setBackgroundColor(
              `color-mix(in srgb, rgb(${r},${g},${b}) 10%, #fff 92%)`,
            );
          }
        })
        .catch(() => {
          setBackgroundColor(null);
        });
    };

    return () => {
      fac.destroy();
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;

  return (
    <span
      className={cn(
        'relative inline-block h-full w-full rounded-lg',
        className,
        {
          'bg-background': backgroundColor === null,
          'border border-border/50 dark:bg-foreground/10':
            backgroundColor === null && props.border,
        },
      )}
      style={
        backgroundColor
          ? {
              backgroundColor: backgroundColor,
            }
          : {}
      }
    >
      {isLoading && !hasError && (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <Skeleton className="w-full h-full" />}
        </span>
      )}
      {!hasError ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            `transition-opacity duration-500 w-full h-full object-contain`,
            {
              'opacity-0': isLoading,
              'opacity-100': !isLoading,
            },
          )}
          {...rest}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <Skeleton className="w-full h-full" />}
        </span>
      )}
    </span>
  );
};

export { ImageWithColorBackground };
