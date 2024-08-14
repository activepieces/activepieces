import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

type LoopIterationInputProps = {
  totalIterations: number;
  value: number;
  onChange: (value: number) => void;
};
const LoopIterationInput = (params: LoopIterationInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(params.value + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value ?? '1';
    const parsedValue = Math.max(
      1,
      Math.min(parseInt(value) ?? 1, params.totalIterations),
    );
    setValue(parsedValue);
    params.onChange(parsedValue - 1);
  }

  function removeFocus() {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (!isNil(inputRef.current) && inputRef.current.value.length === 0) {
      setValue(1);
      params.onChange(0);
    }
    setIsFocused(false);
  }

  return (
    <>
      {!isFocused && (
        <div className="text-sm duration-300 animate-fade">Iteration:</div>
      )}
      <div
        dir="rtl"
        className=" transition-all duration-300 ease-expand-out relative"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: isFocused
            ? '100%'
            : ((inputRef.current?.value.length || 1) * 2.6 + 1) + 'ch',
        }}
      >
        <div
          className={cn(
            'absolute right-3 opacity-0 hidden pointer-events-none  gap-2 justify-center items-center h-full text-sm text-muted-foreground transition-all duration-300',
            {
              flex: isFocused,
              'opacity-100': isFocused,
            },
          )}
          dir="ltr"
        >
          <div className="pointer-events-none">/{params.totalIterations}</div>
          <Button
            variant="transparent"
            className="p-1 text-xs rounded-xs h-auto pointer-events-auto "
            onClick={(e) => {
              inputRef.current?.blur();
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            Done
          </Button>
        </div>
        <Input
          dir="ltr"
          ref={inputRef}
          className="h-7 flex-grow-0  transition-all duration-300 ease-expand-out text-center focus:text-start rounded-sm  focus:w-full p-1"
          style={{
            width: isFocused
              ? '100%'
              : ((inputRef.current?.value.length || 1) * 2.6 + 1) + 'ch',
          }}
          value={value}
          type="number"
          min={1}
          max={params.totalIterations}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => removeFocus()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
              removeFocus();
            }
            if (e.key === 'Escape') {
              removeFocus();
            }
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </div>
    </>
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';
export { LoopIterationInput };
