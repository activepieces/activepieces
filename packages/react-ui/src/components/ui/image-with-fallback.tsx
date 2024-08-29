import React, { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;

  return (
    <div className="relative inline-block">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <div className="w-full h-full bg-muted"></div>}
        </div>
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
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <div className="w-full h-full bg-muted"></div>}
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;
