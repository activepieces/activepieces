import * as React from 'react';

import { cn } from '@/lib/utils';

function FactList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <dl
      data-slot="fact-list"
      className={cn(
        'flex flex-col rounded-2xl bg-panel px-5 shadow-edge',
        className,
      )}
    >
      {children}
    </dl>
  );
}

function Fact({
  label,
  stacked = false,
  className,
  children,
}: {
  label: React.ReactNode;
  stacked?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="fact"
      className={cn(
        'flex min-w-0 gap-4 border-t border-gray-6 py-3 first:border-t-0',
        stacked ? 'flex-col gap-1' : 'items-center justify-between',
        className,
      )}
    >
      <dt className="shrink-0 text-sm text-gray-11">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-sm font-medium text-gray-12 tabular-nums',
          !stacked && 'truncate text-right',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

export { FactList, Fact };
