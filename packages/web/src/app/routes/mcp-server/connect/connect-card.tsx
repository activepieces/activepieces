import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ConnectCard({
  title,
  action,
  className,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'relative flex flex-col gap-4 rounded-xl border bg-panel p-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <h2 className="flex-1 text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
