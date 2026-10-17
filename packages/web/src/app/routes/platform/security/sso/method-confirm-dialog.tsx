import { t } from 'i18next';
import { ReactNode } from 'react';

import { adminLayout } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminControl, adminControl } from '@/lib/admin-control';

export const MethodConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  isPending,
  controlId,
  onConfirm,
}: MethodConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={adminLayout.dialog.md}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          {t('Cancel')}
        </Button>
        <Button
          {...adminControl(controlId)}
          type="button"
          variant={destructive ? 'destructive' : 'default'}
          loading={isPending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

type MethodConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive: boolean;
  isPending: boolean;
  controlId: AdminControl;
  onConfirm: () => void;
};
