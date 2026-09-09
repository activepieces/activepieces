import React from 'react';

import {
  SampleDataNotice,
  SampleTierPill,
} from '@/components/custom/feature-sample';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { SampleUpgradeButton } from './feature-sample';

export const CenteredPage = ({
  title,
  description,
  actions,
  footer,
  children,
  widthClassName = 'max-w-[40rem]',
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
}) => {
  const header =
    title === undefined && !description && !actions ? null : (
      <>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {title !== undefined && (
                <h1 className="text-xl font-medium">{title}</h1>
              )}
              <SampleTierPill />
            </div>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SampleUpgradeButton />
            {actions}
          </div>
        </div>
        <Separator className="my-4" />
        <SampleDataNotice className="mb-4 rounded-md border" />
      </>
    );

  if (!footer) {
    return (
      <div className={cn('w-full mx-auto py-6', widthClassName)}>
        {header}
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className={cn('w-full mx-auto pt-6 shrink-0', widthClassName)}>
        {header}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn('w-full mx-auto pb-6', widthClassName)}>
          {children}
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t bg-background">
        <div
          className={cn(
            'w-full mx-auto py-3 flex justify-end gap-2',
            widthClassName,
          )}
        >
          {footer}
        </div>
      </div>
    </div>
  );
};
