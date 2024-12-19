import React, { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

// In-memory cache to track loaded images
const loadedImages = new Set<string>();

const ImageWithFallback = ({
  src,
  alt,
  fallback,
  ...props
}: ImageWithFallbackProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!src || !loadedImages.has(src));
  useEffect(() => {
    if (src && loadedImages.has(src)) {
      setIsLoading(false);
    }
  }, [src]);

  const handleLoad = () => {
    if (src) {
      loadedImages.add(src); // Mark the image as loaded
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;

  return (
    <span className="relative inline-block h-full ">
      {isLoading && !hasError && (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <span className="w-full h-full bg-muted"></span>}
        </span>
      )}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            `transition-opacity duration-500`,
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
          {fallback ?? <span className="w-full h-full bg-muted"></span>}
        </span>
      )}
    </span>
  );
};

export default ImageWithFallback;
