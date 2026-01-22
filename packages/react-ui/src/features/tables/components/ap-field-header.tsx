import { ChevronDown } from 'lucide-react';
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
import { Permission } from '@activepieces/shared';

import { ClientField } from '../lib/store/ap-tables-client-state';
import { FieldHeaderContext, tablesUtils } from '../lib/utils';

import ApFieldActionMenuItemRenderer, {
  FieldActionType,
} from './field-action-menu-item-renderer';

type ApFieldHeaderProps = {
  field: ClientField & { index: number };
};

export function ApFieldHeader({ field }: ApFieldHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverContent, setPopoverContent] = useState<React.ReactNode>(null);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const actions = userHasTableWritePermission
    ? [FieldActionType.RENAME, FieldActionType.DELETE]
    : [];

  return (
    <FieldHeaderContext.Provider
      value={{
        setIsPopoverOpen,
        setPopoverContent,
        field,
        userHasTableWritePermission,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'h-full w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-muted/50  font-normal',
              'hover:bg-muted cursor-pointer',
              'data-[state=open]:bg-muted',
            )}
          >
            <div className="flex items-center gap-2">
              {tablesUtils.getColumnIcon(field.type)}
              <span className="text-sm">{field.name}</span>
            </div>
            {actions && actions.length > 0 && (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </DropdownMenuTrigger>
        {actions && actions.length > 0 && (
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
