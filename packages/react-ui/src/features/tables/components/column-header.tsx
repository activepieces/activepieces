import { ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ColumnAction = {
  label: string;
  onClick?: () => void;
  content?: ReactNode;
  icon?: ReactNode;
};

type ColumnHeaderProps = {
  label: string;
  icon?: ReactNode;
  actions?: ColumnAction[];
};

export function ColumnHeader({ label, icon, actions }: ColumnHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'h-full w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-muted/50 text-muted-foreground',
            'hover:bg-muted cursor-pointer',
            'data-[state=open]:bg-muted',
          )}
        >
          <div className="flex items-center gap-2">
            {icon}
            {label}
          </div>
          {actions && actions.length > 0 && (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </DropdownMenuTrigger>
      {actions && actions.length > 0 && (
        <DropdownMenuContent align="start" className="w-56 rounded-sm">
          {actions.map((action, index) => (
            <div key={index}>
              {action.content ? (
                action.content
              ) : (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.stopPropagation();
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              )}
            </div>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
