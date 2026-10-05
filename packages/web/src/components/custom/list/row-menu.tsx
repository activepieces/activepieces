import { t } from 'i18next';
import { LucideIcon, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AdminControl, adminControl } from '@/lib/admin-control';

function RowMenu({ items, label = t('More actions') }: RowMenuProps) {
  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) {
    return null;
  }
  const regular = visible.filter((item) => !item.destructive);
  const destructive = visible.filter((item) => item.destructive);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-44"
        onClick={(event) => event.stopPropagation()}
      >
        {regular.map((item) => (
          <RowMenuEntry key={item.label} item={item} />
        ))}
        {regular.length > 0 && destructive.length > 0 && (
          <DropdownMenuSeparator />
        )}
        {destructive.map((item) => (
          <RowMenuEntry key={item.label} item={item} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowMenuEntry({ item }: { item: RowMenuItem }) {
  const Icon = item.icon;
  const entry = (
    <DropdownMenuItem
      {...adminControl(item.controlId)}
      variant={item.destructive ? 'destructive' : 'default'}
      disabled={item.disabled}
      onSelect={() => item.onSelect()}
    >
      {Icon && <Icon />}
      {item.label}
    </DropdownMenuItem>
  );
  if (item.disabled && item.disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{entry}</div>
        </TooltipTrigger>
        <TooltipContent side="left">{item.disabledReason}</TooltipContent>
      </Tooltip>
    );
  }
  return entry;
}

export { RowMenu };

export type RowMenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  hidden?: boolean;
  controlId?: AdminControl;
};

type RowMenuProps = {
  items: RowMenuItem[];
  label?: string;
};
