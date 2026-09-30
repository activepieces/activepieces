import * as React from 'react';

import { cn } from '@/lib/utils';

function DialogNav({ className, ...props }: React.ComponentProps<'aside'>) {
  return (
    <aside
      data-slot="dialog-nav"
      className={cn(
        'flex w-60 shrink-0 flex-col gap-2 border-r bg-gray-2 p-2',
        className,
      )}
      {...props}
    />
  );
}

function DialogNavGroup({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<'nav'> & { label?: string }) {
  return (
    <nav className={cn('flex flex-col gap-1', className)} {...props}>
      {label && (
        <span className="flex h-8 items-center px-2 text-sm font-medium text-gray-11">
          {label}
        </span>
      )}
      {children}
    </nav>
  );
}

function DialogNavItem({
  active = false,
  className,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 w-full items-center gap-2.5 rounded-xl px-2 text-left text-sm text-gray-12 outline-hidden transition-colors hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-accent-8 data-active:bg-gray-4 data-active:font-medium [&_svg]:size-5 [&_svg]:shrink-0 [&>span:last-child]:truncate',
        className,
      )}
      {...props}
    />
  );
}

export { DialogNav, DialogNavGroup, DialogNavItem };
