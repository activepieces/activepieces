import React from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const CenteredPage = ({
  title,
  description,
  actions,
  children,
  maxWidth = 'max-w-[40rem]',
}: {
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) => {
  return (
    <div className={cn('w-full mx-auto py-6', maxWidth)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium">{title}</h1>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <Separator className="my-4" />
      {children}
    </div>
  );
};
