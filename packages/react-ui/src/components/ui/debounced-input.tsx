import * as React from 'react';

import { Input } from '@/components/ui/input';

type DebouncedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> & {
  debounce?: number;
  onChange: (value: string) => void;
};

export const DebouncedInput = React.forwardRef<
  HTMLInputElement,
  DebouncedInputProps
>(({ value: initialValue, onChange, debounce = 500, ...props }, ref) => {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      ref={ref}
      {...props}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';
