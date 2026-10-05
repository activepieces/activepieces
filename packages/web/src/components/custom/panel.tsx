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
  tone = 'default',
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean;
  tone?: PanelTone;
  className?: string;
  children: React.ReactNode;
}) {
  const accent = tone === 'accent';
  return (
    <Card
      data-slot="panel"
      data-tone={tone}
      className={cn(
        'gap-0 py-0',
        accent && 'border border-accent-6 shadow-none',
        className,
      )}
    >
      {(title || action) && (
        <CardHeader
          className={cn(
            'border-b pt-5',
            accent && 'border-accent-6 bg-accent-2',
          )}
        >
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
  return <ItemGroup className={cn(className)} {...props} />;
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
    <Item className={cn('items-center border-x-0 border-b-0 px-5', className)}>
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

export type PanelTone = 'default' | 'accent';
