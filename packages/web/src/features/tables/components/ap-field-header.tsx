import { Permission } from '@activepieces/core-utils';
import { ChevronDown, GripVertical } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';

import { ClientField } from '../stores/store/ap-tables-client-state';
import { FieldHeaderContext, tablesUtils } from '../utils/utils';

import { useTableState } from './ap-table-state-provider';
import ApFieldActionMenuItemRenderer, {
  FieldActionType,
} from './field-action-menu-item-renderer';

type ApFieldHeaderProps = {
  field: ClientField & { index: number };
};

export function ApFieldHeader({ field }: ApFieldHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverContent, setPopoverContent] = useState<React.ReactNode>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lockedByOtherUser = useTableState((state) => state.lockedByOtherUser);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE
  );
  const canEdit = userHasTableWritePermission && !lockedByOtherUser;
  const actions = canEdit
    ? [FieldActionType.RENAME, FieldActionType.DELETE]
    : [];
  const hasActions = actions.length > 0;

  return (
    <FieldHeaderContext.Provider
      value={{
        setIsPopoverOpen,
        setPopoverContent,
        field,
        userHasTableWritePermission: canEdit,
      }}
    >
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <div
          onClick={() => hasActions && setIsMenuOpen(true)}
          className={cn(
            'group relative h-full w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-muted/50  font-normal',
            hasActions && 'hover:bg-muted cursor-pointer',
            isMenuOpen && 'bg-muted'
          )}
        >
          <div className="flex items-center gap-2">
            {canEdit && (
              <GripVertical
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 shrink-0 text-muted-foreground/60 opacity-0 cursor-grab active:cursor-grabbing transition-opacity group-hover:opacity-100"
              />
            )}
            {tablesUtils.getColumnIcon(field.type)}
            <span className="text-sm">{field.name}</span>
          </div>
          {hasActions && <ChevronDown className="h-4 w-4" />}
          <DropdownMenuTrigger asChild>
            <span
              className="absolute inset-0 pointer-events-none"
              aria-hidden
            />
          </DropdownMenuTrigger>
        </div>
        {hasActions && (
          <DropdownMenuContent
            noAnimationOnOut={true}
            onCloseAutoFocus={(e) => e.preventDefault()}
            align="start"
            className="w-56 rounded-sm"
          >
            {actions.map((action, index) => (
              <div key={index}>
                {<ApFieldActionMenuItemRenderer action={action} />}
              </div>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="w-full h-full -mt-[40px] pointer-events-none"></div>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-3">
          {popoverContent}
        </PopoverContent>
      </Popover>
    </FieldHeaderContext.Provider>
  );
}
