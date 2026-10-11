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
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setOpen = (next: boolean) => {
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
      >
        <ConfirmDialogBody
          key={isOpen ? 'open' : 'closed'}
          {...bodyProps}
          onDone={() => setOpen(false)}
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
}: ConfirmDialogBodyProps) {
  const inputId = useId();
  const [typed, setTyped] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await onConfirm();
    },
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
        <DialogTitle>{title}</DialogTitle>
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
          <Label htmlFor={inputId} className="font-normal text-gray-11">
            {t('Type {name} to confirm', { name: typeToConfirm })}
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
};

export type ConfirmDialogProps = Omit<ConfirmDialogBodyProps, 'onDone'> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};
