import * as React from 'react';

import { cn } from '@/lib/utils';

const inputClass =
  'h-9 w-full min-w-0 rounded-lg border border-gray-7 bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-accent-9 selection:text-on-accent file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-12 placeholder:text-gray-11 focus-visible:border-accent-8 focus-visible:ring-3 focus-visible:ring-accent-8/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-9 aria-invalid:ring-3 aria-invalid:ring-danger-9/20';

function Input({ className, type, size = 'default', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        inputClass,
        size === 'sm' && 'h-8 px-2.5 text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input, inputClass };

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  size?: 'sm' | 'default';
};

export type { InputProps };
