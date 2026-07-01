import { TableColor } from '@activepieces/shared';
import { t } from 'i18next';
import { Ban } from 'lucide-react';
import { useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { tableColors } from '../utils/table-colors';

type TableColorPickerProps = {
  children: React.ReactNode;
  onPick: (color: TableColor | null) => void;
  align?: 'start' | 'center' | 'end';
};

export function TableColorPicker({
  children,
  onPick,
  align = 'end',
}: TableColorPickerProps) {
  const [open, setOpen] = useState(false);
  const handlePick = (color: TableColor | null) => {
    setOpen(false);
    onPick(color);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" align={align}>
        <div className="grid grid-cols-5 gap-1.5">
          {tableColors.order.map((color) => (
            <button
              key={color}
              type="button"
              title={t(tableColors.label[color])}
              aria-label={t(tableColors.label[color])}
              onClick={() => handlePick(color)}
              className={cn(
                'size-6 rounded-full border border-border/40 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tableColors.swatchClass[color],
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => handlePick(null)}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
        >
          <Ban className="size-3.5" />
          {t('Clear color')}
        </button>
      </PopoverContent>
    </Popover>
  );
}
