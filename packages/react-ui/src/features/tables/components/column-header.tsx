import { t } from 'i18next';
import { ChevronDown, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FieldType } from '@activepieces/shared';

import { getColumnIcon } from '../lib/utils';

export enum ColumnActionType {
  DELETE,
}

export type ColumnAction = {
  type: ColumnActionType;
  onClick: () => Promise<void>;
};

type ColumnHeaderProps = {
  label: string;
  type: FieldType;
  actions?: ColumnAction[];
};

export function ColumnHeader({ label, type, actions }: ColumnHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderAction = (action: ColumnAction) => {
    switch (action.type) {
      case ColumnActionType.DELETE:
        return (
          <ConfirmationDeleteDialog
            title={t('Delete Field')}
            message={t(
              'Are you sure you want to delete this field? This action cannot be undone.',
            )}
            mutationFn={action.onClick}
            entityName={t('field')}
          >
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
              className="flex items-center gap-2 text-destructive cursor-pointer"
            >
              <Trash className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        );
      default:
        return null;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'h-full w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-muted/50 text-muted-foreground font-normal',
            'hover:bg-muted cursor-pointer',
            'data-[state=open]:bg-muted',
          )}
        >
          <div className="flex items-center gap-2">
            {getColumnIcon(type)}
            <span className="text-sm">{label}</span>
          </div>
          {actions && actions.length > 0 && (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </DropdownMenuTrigger>
      {actions && actions.length > 0 && (
        <DropdownMenuContent align="start" className="w-56 rounded-sm">
          {actions.map((action, index) => (
            <div key={index}>{renderAction(action)}</div>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
