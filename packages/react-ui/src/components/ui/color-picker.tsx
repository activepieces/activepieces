'use client';

import { cn, useForwardedRef } from '@/lib/utils';
import ContrastColor from "contrast-color";
import { Check } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { ButtonProps } from './button';
import { Button } from './button';
import { Input } from './input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface ColorPickerProps {
  onClose?: () => void;
  onSave?: (value: string) => void;
  defaultValue?: string;
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
  (
    { disabled, onClose, onSave, defaultValue, name, className, ...props },
    forwardedRef
  ) => {
    const [color, setColor] = useState(defaultValue || '#FFFFFF');
    const [savedColor, setSavedColor] = useState(defaultValue || '#FFFFFF');
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onClose}>
          <Button
            {...props}
            className={cn('block', className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size='icon'
            style={{
              backgroundColor: savedColor,
            }}
            variant='outline'
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='flex flex-col gap-3 items-center max-w-min'>
          <HexColorPicker color={color} onChange={setColor} />
          <div className="flex flex-row gap-2 items-center">
            <Input
              maxLength={7}
              onChange={(e) => {
                setColor(e?.currentTarget?.value);
              }}
              ref={ref}
              value={color}
              color={color}
            />
            <Button
              variant="outline"
              size="icon"
              className="rounded-full px-3"
              onClick={() => {
                onSave?.(color);
                setSavedColor(color);
                setOpen(false);
              }}
              style={{
                backgroundColor: color,
                color: ContrastColor.contrastColor({ bgColor: color }),
              }}
            >
              <Check className="size-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker as ComplexColorPicker };
