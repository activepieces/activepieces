'use client';

import { forwardRef, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useForwardedRef } from '@/hooks/use-forwarded-ref';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
  (
    { disabled, value, onChange, onBlur, name, className, side, ...props },
    forwardedRef,
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);

    const parsedValue = useMemo(() => {
      return value || '#FFFFFF';
    }, [value]);

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn('block rounded-full', className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size="icon"
            style={{
              backgroundColor: parsedValue,
            }}
            variant="outline"
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align="start"
          className="flex w-60 flex-col gap-3"
        >
          <HexColorPicker
            className="w-full! h-44!"
            color={parsedValue}
            onChange={onChange}
          />
          <Input
            size="sm"
            className="font-mono"
            maxLength={7}
            onChange={(e) => {
              onChange(e?.currentTarget?.value);
            }}
            ref={ref}
            value={parsedValue}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
