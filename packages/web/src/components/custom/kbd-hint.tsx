import { isMac } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

export function KbdHint({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <kbd className={cn('font-sans text-xs text-gray-11', className)}>
      {children}
    </kbd>
  );
}

export function modShortcut({
  key,
  shift = false,
}: {
  key: string;
  shift?: boolean;
}): string {
  if (isMac()) return `${shift ? '⇧' : ''}⌘${key}`;
  return `Ctrl ${shift ? 'Shift ' : ''}${key}`;
}
