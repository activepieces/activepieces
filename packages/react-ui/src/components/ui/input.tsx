import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex-grow h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:cursor-pointer file:float-right file:mx-2 file:border-1 file:border-solid file:border-muted file:rounded-sm file:bg-accent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 box-border',
          className,
          {
            'cursor-pointer': type === 'file',
          },
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
