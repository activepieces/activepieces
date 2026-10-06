import { VariantProps, cva } from 'class-variance-authority';
import React from 'react';

import { ImageWithFallback } from '@/components/custom/image-with-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { logoTint } from '@/lib/logo-tint';
import { cn } from '@/lib/utils';

const logoPlateVariants = cva(
  'flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-1 text-gray-12',
  {
    variants: {
      size: {
        xxs: 'size-4',
        xs: 'size-6.25',
        sm: 'size-7.5',
        md: 'size-9',
        lg: 'size-10',
        xl: 'size-12',
        xxl: 'size-16',
      },
      border: {
        true: 'border border-solid',
      },
      tint: {
        true: 'transition-colors duration-300',
      },
    },
  },
);

const logoPlatePadding = cva('', {
  variants: {
    size: {
      xxs: 'p-px',
      xs: 'p-1.25',
      sm: 'p-1.25',
      md: 'p-1.75',
      lg: 'p-2',
      xl: 'p-3',
      xxl: 'p-4',
    },
  },
});

export const LogoPlate = React.memo(
  ({
    src,
    alt,
    title,
    size,
    border,
    className,
    innerClassName,
    fallback,
    tint,
  }: LogoPlateProps) => {
    const tintColor = logoTint.useLogoTint({ src, enabled: tint === true });
    return (
      <div
        data-theme="light"
        title={title}
        className={cn(logoPlateVariants({ size, border, tint }), className)}
        style={tintColor ? { backgroundColor: tintColor } : undefined}
      >
        {src ? (
          <ImageWithFallback
            src={src}
            alt={alt}
            className={cn(logoPlatePadding({ size }), innerClassName)}
            fallback={fallback}
          />
        ) : (
          fallback ?? <Skeleton className="h-full w-full rounded-md" />
        )}
      </div>
    );
  },
);

LogoPlate.displayName = 'LogoPlate';

export type LogoPlateProps = VariantProps<typeof logoPlateVariants> & {
  src?: string;
  alt?: string;
  title?: string;
  className?: string;
  innerClassName?: string;
  fallback?: React.ReactNode;
};
