import { ReactNode } from 'react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

import { adminSurface } from './admin-surface';

export function AdminEmpty({
  icon,
  title,
  description,
  action,
  framed = true,
  className,
}: AdminEmptyProps) {
  return (
    <Empty
      className={cn(
        'flex-none',
        framed && cn(adminSurface.listFrame, 'border-solid'),
        className,
      )}
    >
      <EmptyHeader>
        {icon && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

type AdminEmptyProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  framed?: boolean;
  className?: string;
};
