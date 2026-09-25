import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function PageBand({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn('mx-auto w-full max-w-page-band px-6 lg:px-12', className)}
    >
      {children}
    </div>
  );
}
