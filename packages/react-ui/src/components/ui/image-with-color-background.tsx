import React, { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { colorsUtils } from '@/lib/color-utils';
import { cn } from '@/lib/utils';

interface ImageWithColorBackgroundProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  border?: boolean;
}
const ImageWithColorBackground = ({
  src,
  alt,
  fallback,
  ...props
}: ImageWithColorBackgroundProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const backgroundColor = colorsUtils.useAverageColorInImage({
    imgUrl: src ?? '',
    transparency: 10,
  });
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
