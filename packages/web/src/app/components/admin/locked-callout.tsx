import { Crown } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { adminSurface } from './admin-surface';

export function LockedCallout({
  variant,
  icon,
  title,
  description,
  className,
  children,
}: LockedCalloutProps) {
  if (variant === 'inline') {
    return (
      <div
        data-slot="locked-callout"
        className={cn(
          adminSurface.lockedInline,
          'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm text-accent-11',
          className,
        )}
      >
        <span className="flex shrink-0 [&_svg:not([class*='size-'])]:size-4">
          {icon ?? <Crown />}
        </span>
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
          <span className="font-medium">{title}</span>
          {description && <span>{description}</span>}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
    );
  }

  return (
    <div
      data-slot="locked-callout"
      className={cn(
        adminSurface.lockedOverlay,
        'pointer-events-auto flex w-full max-w-md flex-col gap-4 p-6',
        className,
      )}
    >
      <div className="grid size-10 place-items-center rounded-lg bg-accent-3 text-accent-11 [&_svg:not([class*='size-'])]:size-5">
        {icon ?? <Crown />}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-12">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-gray-11">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

type LockedCalloutProps = {
  variant: 'overlay' | 'inline';
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
};
