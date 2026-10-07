import { t } from 'i18next';
import { ReactNode, useState } from 'react';

import { LeaveWithoutSavingDialog } from '@/components/custom/leave-without-saving';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

export function PolicyConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequence,
  typeToConfirm,
  confirmLabel,
  destructive = true,
  controlId,
  onConfirm,
}: PolicyConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open && (
          <PolicyConfirmBody
            title={title}
            description={description}
            consequence={consequence}
            typeToConfirm={typeToConfirm}
            confirmLabel={confirmLabel}
            destructive={destructive}
            controlId={controlId}
            onConfirm={onConfirm}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

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
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
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
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);
        if (option) onValueChange(option.value);
      }}
    >
      <TabsList>
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

function PolicyConfirmBody({
  title,
  description,
  consequence,
  typeToConfirm,
  confirmLabel,
  destructive,
  controlId,
  onConfirm,
  onClose,
}: Omit<PolicyConfirmDialogProps, 'open' | 'onOpenChange'> & {
  onClose: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const confirmed =
    typeToConfirm === undefined || typed.trim() === typeToConfirm.trim();

  const confirm = async () => {
    setPending(true);
    const result = await Promise.resolve(onConfirm()).then(
      () => true,
      () => false,
    );
    setPending(false);
    if (result) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {consequence && (
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            destructive
              ? 'border-danger-7 bg-danger-3 text-danger-11'
              : 'bg-gray-2 text-gray-12',
          )}
        >
          {consequence}
        </div>
      )}
      {typeToConfirm !== undefined && (
        <label className="flex flex-col gap-2 text-sm text-gray-11">
          <span>{t('Type {name} to confirm.', { name: typeToConfirm })}</span>
          <Input
            value={typed}
            autoFocus
            onChange={(event) => setTyped(event.target.value)}
          />
        </label>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onClose}
        >
          {t('Cancel')}
        </Button>
        <Button
          {...adminControl(controlId)}
          type="button"
          variant={destructive ? 'destructive' : 'default'}
          loading={pending}
          disabled={!confirmed}
          onClick={() => {
            confirm().catch(() => undefined);
          }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

type PolicyConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  consequence?: ReactNode;
  typeToConfirm?: string;
  confirmLabel: string;
  destructive?: boolean;
  controlId?: AdminControl;
  onConfirm: () => Promise<unknown> | unknown;
};

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
