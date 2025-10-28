import React from 'react';

import { cn } from '@/lib/utils';

const inputClass =
  'flex-grow flex  h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 box-border';

const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <div className={cn(inputClass, className, 'items-center gap-2')}>
    {props.icon}
    <input
      ref={ref}
      className={cn(
        'flex h-full w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground',
        { 'cursor-not-allowed opacity-50': props.disabled },
      )}
      {...props}
    />
  </div>
));
InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
