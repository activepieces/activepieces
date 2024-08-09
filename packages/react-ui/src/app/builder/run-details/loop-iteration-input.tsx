import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

type LoopIterationInputProps = {
  totalIterations: number;
  value: number;
  onChange: (value: number) => void;
};
// TODO add the max value in the input (the total number of iterations)
const LoopIterationInput = (params: LoopIterationInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(params.value + 1);
  const descRef = useRef<HTMLInputElement>(null);

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
    if (descRef.current) {
      descRef.current.blur();
    }
    setIsFocused(false);
  }

  return (
    <div className="flex gap-2 items-center">
      <span className={`text-sm ${isFocused ? 'hidden' : ''}`}>Iteration:</span>
      <Input
        ref={descRef}
        className="h-7 w-18 focus:w-40 transition-all duration-300 ease-in-out"
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
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';
export { LoopIterationInput };
