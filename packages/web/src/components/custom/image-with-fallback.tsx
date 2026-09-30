import React, { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const ImageWithFallback = ({
  src,
  alt,
  fallback,
  className,
  imageClassName,
  ...rest
}: ImageWithFallbackProps) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasError = failedSrc !== null && failedSrc === src;
  const isLoading = !hasError && loadedSrc !== src;
  const monogram = alt?.trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        'relative inline-block h-full w-full overflow-hidden',
        className,
      )}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </span>
      )}
      {hasError ? (
        <span
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="absolute inset-0 flex items-center justify-center"
        >
          {fallback ?? (
            <span className="text-sm font-semibold leading-none">
              {monogram}
            </span>
          )}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoadedSrc(src ?? null)}
          onError={() => setFailedSrc(src ?? null)}
          className={cn(
            'h-full w-full object-contain transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            imageClassName,
          )}
          {...rest}
        />
      )}
    </span>
  );
};

export type ImageWithFallbackProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'className'
> & {
  className?: string;
  imageClassName?: string;
  fallback?: React.ReactNode;
};
