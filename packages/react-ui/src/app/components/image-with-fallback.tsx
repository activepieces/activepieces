import React, { useState } from 'react';

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
          className={`transition-opacity duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          {...props}
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
