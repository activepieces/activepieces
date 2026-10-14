import { ReactNode, useState } from 'react';

import { adminLayout } from '@/app/components/admin';
import { LeaveWithoutSavingDialog } from '@/components/custom/leave-without-saving';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

export function PolicySheet({
  open,
  onRequestClose,
  title,
  description,
  toolbar,
  footer,
  busy = false,
  children,
}: PolicySheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onRequestClose()}>
      <SheetContent
        className={cn(adminLayout.sheet.md, 'flex flex-col gap-0 p-0')}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {toolbar && (
          <fieldset
            disabled={busy}
            className="flex min-w-0 shrink-0 flex-col gap-2 border-b px-6 py-4"
          >
            {toolbar}
          </fieldset>
        )}
        <fieldset
          disabled={busy}
          aria-busy={busy}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5"
        >
          {children}
        </fieldset>
        {footer && <SheetFooter className="p-0">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}

export function savedOrThrow(saved: Promise<boolean>): Promise<void> {
  return saved.then((ok) => {
    if (!ok) {
      const error = new Error('Change not saved');
      mutationFeedback.markShown(error);
      throw error;
    }
  });
}

export function sameNames(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const names = new Set(left);
  return right.every((name) => names.has(name));
}

export function useGuardedClose({
  dirty,
  onClose,
}: {
  dirty: boolean;
  onClose: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const requestClose = () => (dirty ? setAsking(true) : onClose());
  const dialog = (
    <LeaveWithoutSavingDialog
      open={asking}
      onKeepEditing={() => setAsking(false)}
      onDiscard={() => {
        setAsking(false);
        onClose();
      }}
    />
  );
  return { requestClose, dialog };
}

export function CountTabs<T extends string>({
  value,
  onValueChange,
  options,
  label,
}: CountTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-9 max-w-full min-w-0 items-center overflow-x-auto rounded-lg bg-gray-3 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onValueChange(option.value)}
          className="inline-flex h-full shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap text-gray-11 transition-colors hover:text-gray-12 focus-visible:outline-2 focus-visible:outline-accent-8 aria-pressed:bg-panel aria-pressed:text-gray-12 aria-pressed:shadow-xs"
        >
          {option.label}
          {option.count !== undefined && (
            <span className="text-xs text-gray-11 tabular-nums">
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function RailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-gray-12">{title}</h2>
      {children}
    </section>
  );
}

export function SkeletonRows({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn('w-full', className)} />
      ))}
    </div>
  );
}

type PolicySheetProps = {
  open: boolean;
  onRequestClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  children: ReactNode;
};

type CountTabsProps<T extends string> = {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
};
