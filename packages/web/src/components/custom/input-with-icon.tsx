import React from 'react';

import { cn } from '@/lib/utils';

const inputClass =
  'grow flex h-9 w-full rounded-sm border border-gray-6 bg-gray-1 px-3 py-2 text-sm ring-offset-gray-1 placeholder:text-gray-11 focus-within:outline-hidden focus-within:ring-1 focus-within:ring-gray-8 focus-within:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 box-border';

const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon: React.ReactNode;
  }
>(({ className, icon, ...props }, ref) => (
  <div className={cn(inputClass, className, 'items-center gap-2')}>
    {icon}
    <input
      ref={ref}
      className={cn(
        'flex h-full w-full rounded-md bg-transparent text-sm outline-hidden placeholder:text-gray-11',
        { 'cursor-not-allowed opacity-50': props.disabled },
      )}
      {...props}
    />
  </div>
));
InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
