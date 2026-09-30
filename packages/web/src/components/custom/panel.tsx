import * as React from 'react';

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';

function Panel({
  title,
  description,
  action,
  flush = false,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card data-slot="panel" className={cn('gap-0 py-0', className)}>
      {(title || action) && (
        <CardHeader className="border-b pt-5">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <div className={cn('flex flex-col', !flush && 'gap-3 p-5')}>
        {children}
      </div>
    </Card>
  );
}

function SettingRows({ className, ...props }: React.ComponentProps<'div'>) {
  return <ItemGroup className={cn('px-1', className)} {...props} />;
}

function SettingRow({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Item className={cn('items-center', className)}>
      {icon && <ItemMedia variant="icon">{icon}</ItemMedia>}
      <ItemContent className="min-w-0">
        <ItemTitle>{title}</ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>
      {children && <ItemActions>{children}</ItemActions>}
    </Item>
  );
}

export { Panel, SettingRows, SettingRow };
