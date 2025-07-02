import React, { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

const ImageWithFallback = ({
  src,
  alt,
  fallback,
  ...props
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;

  return (
    <span className={cn('relative inline-block h-full w-full', className)}>
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
            `transition-opacity duration-500 w-full h-full object-cover`,
            {
              'opacity-0': isLoading,
              'opacity-100': !isLoading,
            },
            className,
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

export default ImageWithFallback;
