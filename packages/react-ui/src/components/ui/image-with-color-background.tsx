import React, { useState, useEffect, useRef } from 'react';
import { FastAverageColor } from 'fast-average-color';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithColorBackgroundProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

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
        .getColorAsync(img)
        .then((color) => {
          setBackgroundColor(
            `color-mix(in srgb, rgb(${color.value[0]},${color.value[1]},${color.value[2]}) 20%, #fff 80%)`
          );
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
      className={cn('relative inline-block h-full w-full rounded-lg', className)}
      style={{
        backgroundColor: backgroundColor ?? 'transparent',
      }}
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

