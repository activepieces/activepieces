import { ChevronDown, GripVertical } from 'lucide-react';
import { useState } from 'react';

import {
  useSortable,
} from "@dnd-kit/sortable";
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

  const { attributes, listeners, setNodeRef, transform, isDragging } =
  useSortable({ id: field.uuid });

  return (
    <FieldHeaderContext.Provider
      value={{
        field,
        setIsPopoverOpen,
        setPopoverContent,
        userHasTableWritePermission,
      }}
    >
      <div
        className={cn(
          'h-full w-full flex items-center justify-between gap-2 pl-2 bg-muted/50 font-normal',
          'data-[state=open]:bg-muted',
          isDragging ? 'opacity-50' : 'opacity-100'
        )}
      >
        <DropdownMenu>
          <div ref={setNodeRef} {...attributes} {...listeners}
            className={cn("transition-all cursor-grab h-full flex items-center")}
          >
            <GripVertical size={12} />
          </div>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  'h-full w-full flex items-center justify-between gap-2 px-3',
                  'hover:bg-muted',
                  'cursor-pointer',
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
      </div>
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
