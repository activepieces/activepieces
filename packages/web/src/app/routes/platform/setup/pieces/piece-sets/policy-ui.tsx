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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function PolicySheet({
  open,
  onRequestClose,
  title,
  description,
  toolbar,
  footer,
  children,
}: PolicySheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onRequestClose()}>
      <SheetContent
        className={cn(adminLayout.sheet.md, 'flex flex-col gap-0 p-0')}
      >
        <SheetHeader className="border-b p-5 pr-12">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {toolbar && (
          <div className="flex shrink-0 flex-col gap-2 border-b p-5">
            {toolbar}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
          {children}
        </div>
        {footer && <SheetFooter className="p-0">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
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
}: CountTabsProps<T>) {
  return (
    <Tabs
      className="max-w-full min-w-0 overflow-x-auto"
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);
        if (option) onValueChange(option.value);
      }}
    >
      <TabsList className="w-max">
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1.5 text-xs text-gray-11 tabular-nums">
                {option.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
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
  children: ReactNode;
};

type CountTabsProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
};
