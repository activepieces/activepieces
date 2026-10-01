import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

export const ConfirmDialog = ({
  open,
  onOpenChange,
  children,
  ...bodyProps
}: ConfirmDialogProps) => {
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
        showCloseButton={false}
        onClick={(event) => event.stopPropagation()}
      >
        <ConfirmDialogBody
          key={isOpen ? 'open' : 'closed'}
          {...bodyProps}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

const ConfirmDialogBody = ({
  title,
  description,
  consequence,
  confirmLabel,
  typeToConfirm,
  destructive = true,
  confirmDisabled,
  successMessage,
  onConfirm,
  onError,
  onClose,
}: ConfirmDialogBodyProps) => {
  const [typed, setTyped] = useState('');
  const typedMatches = !typeToConfirm || typed.trim() === typeToConfirm;
  const canConfirm = typedMatches && !confirmDisabled;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await onConfirm();
    },
    onSuccess: () => {
      onClose();
      if (successMessage) {
        toast.success(successMessage);
      }
    },
    onError,
  });

  const confirm = () => {
    if (canConfirm && !isPending) {
      mutate();
    }
  };

  return (
    <>
      <DialogHeader className="min-w-0 pr-0">
        <DialogTitle className="break-words">{title}</DialogTitle>
        <DialogDescription className="break-words">
          {description}
        </DialogDescription>
      </DialogHeader>
      {consequence && (
        <div className="flex items-start gap-2 text-sm text-gray-12">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-11" />
          <div className="min-w-0 break-words">{consequence}</div>
        </div>
      )}
      {typeToConfirm && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-dialog-typed">
            <TypeToConfirmLabel target={typeToConfirm} />
          </Label>
          <Input
            id="confirm-dialog-typed"
            value={typed}
            autoFocus
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
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onClose}
        >
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          variant={destructive ? 'destructive' : 'default'}
          loading={isPending}
          disabled={!canConfirm}
          onClick={confirm}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
};

const TypeToConfirmLabel = ({ target }: { target: string }) => {
  const [before, after] = t('Type {name} to confirm', {
    name: TARGET_MARKER,
  }).split(TARGET_MARKER);
  return (
    <span className="min-w-0 break-words font-normal">
      {before}
      <span className="font-mono font-medium text-gray-12">{target}</span>
      {after}
    </span>
  );
};

const TARGET_MARKER = '\u0000';

type ConfirmDialogBodyProps = {
  title: string;
  description: React.ReactNode;
  consequence?: React.ReactNode;
  confirmLabel: string;
  typeToConfirm?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  successMessage?: string;
  onConfirm: () => Promise<unknown> | unknown;
  onError?: (error: Error) => void;
  onClose: () => void;
};

type ConfirmDialogProps = Omit<ConfirmDialogBodyProps, 'onClose'> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export type { ConfirmDialogProps };
