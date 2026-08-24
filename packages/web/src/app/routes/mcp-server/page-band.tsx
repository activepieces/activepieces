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
    <div className={cn('mx-auto w-full max-w-[1198px]', className)}>
      {children}
    </div>
  );
}
