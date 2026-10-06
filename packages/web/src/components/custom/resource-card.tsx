import * as React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function ResourceCard({
  media,
  title,
  status,
  meta,
  menu,
  action,
  onOpen,
  children,
  className,
}: {
  media?: React.ReactNode;
  title: React.ReactNode;
  status?: React.ReactNode;
  meta?: React.ReactNode;
  menu?: React.ReactNode;
  action?: React.ReactNode;
  onOpen?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      data-slot="resource-card"
      variant={onOpen ? 'interactive' : 'default'}
      onClick={onOpen}
      className={cn('gap-3 p-5', className)}
    >
      <div className="flex min-w-0 items-start gap-3">
        {media && <div className="shrink-0">{media}</div>}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="truncate font-medium text-gray-12">{title}</div>
          {status}
        </div>
        {menu && (
          <div
            className="shrink-0"
            onClick={(event) => event.stopPropagation()}
          >
            {menu}
          </div>
        )}
      </div>
      {meta && <div className="text-sm text-gray-11">{meta}</div>}
      {children}
      {action && (
        <div
          className="flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          {action}
        </div>
      )}
    </Card>
  );
}

function ResourceGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="resource-grid"
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3',
        className,
      )}
      {...props}
    />
  );
}

export { ResourceCard, ResourceGrid };
