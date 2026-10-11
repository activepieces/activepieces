import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { ReactNode, useId, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { adminLayout } from './admin-layout';

export function ConfirmDialog({
  open,
  onOpenChange,
  children,
  ...bodyProps
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!next && pending) {
      return;
    }
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className={adminLayout.dialog.sm}
        onClick={(event) => event.stopPropagation()}
        onEscapeKeyDown={(event) => pending && event.preventDefault()}
        onInteractOutside={(event) => pending && event.preventDefault()}
      >
        <ConfirmDialogBody
          key={isOpen ? 'open' : 'closed'}
          {...bodyProps}
          onPendingChange={setPending}
          onDone={() => {
            setPending(false);
            if (!isControlled) {
              setUncontrolledOpen(false);
            }
            onOpenChange?.(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialogBody({
  title,
  description,
  consequence,
  confirmLabel,
  destructive = true,
  typeToConfirm,
  successMessage,
  onConfirm,
  controlId,
  onDone,
  onPendingChange,
}: ConfirmDialogBodyProps) {
  const inputId = useId();
  const [typed, setTyped] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      onPendingChange?.(true);
      await onConfirm();
    },
    onSettled: () => onPendingChange?.(false),
    onSuccess: () => {
      onDone();
      if (successMessage) {
        toast.success(successMessage);
      }
    },
    onError: (error) => {
      if (!mutationFeedback.wasShown(error)) {
        mutationFeedback.error({ error });
      }
    },
  });
  const typedMatches =
    typeToConfirm === undefined || typed.trim() === typeToConfirm.trim();
  const confirm = () => {
    if (typedMatches && !isPending) {
      mutate();
    }
  };

  return (
    <>
      <DialogHeader className="min-w-0">
        <DialogTitle className="break-words">{title}</DialogTitle>
        {description && (
          <DialogDescription className="break-words">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      {consequence && (
        <Alert variant="warning">
          <TriangleAlert className="size-4" />
          <AlertDescription>{consequence}</AlertDescription>
        </Alert>
      )}
      {typeToConfirm !== undefined && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId} className="block font-normal text-gray-11">
            {t('To confirm, type')}{' '}
            <span className="font-medium text-gray-12">{typeToConfirm}</span>
          </Label>
          <Input
            id={inputId}
            value={typed}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirm();
              }
            }}
          />
        </div>
      )}
      <DialogFooter className="mt-2">
        <Button variant="outline" disabled={isPending} onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          loading={isPending}
          disabled={!typedMatches}
          onClick={confirm}
          {...adminControl(controlId)}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

type ConfirmDialogBodyProps = {
  title: string;
  description?: ReactNode;
  consequence?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  typeToConfirm?: string;
  successMessage?: string;
  onConfirm: () => Promise<unknown> | unknown;
  controlId?: AdminControl;
  onDone: () => void;
  onPendingChange?: (pending: boolean) => void;
};

export type ConfirmDialogProps = Omit<
  ConfirmDialogBodyProps,
  'onDone' | 'onPendingChange'
> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};
