import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { adminLayout } from '@/app/components/admin';
import { TypeToConfirm } from '@/components/custom/type-to-confirm';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  warning,
  confirmDisabled = false,
  confirmText,
  onConfirm,
}: MethodConfirmDialogProps) => {
  const [typed, setTyped] = useState('');
  const handleOpenChange = (next: boolean) => {
    setTyped('');
    onOpenChange(next);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={adminLayout.dialog.md}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {warning && (
          <Alert variant="warning">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}
        {confirmText && !confirmDisabled && (
          <TypeToConfirm
            id="method-confirm-text"
            text={confirmText}
            value={typed}
            onChange={setTyped}
          />
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(controlId)}
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            loading={isPending}
            disabled={
              confirmDisabled || (!!confirmText && typed !== confirmText)
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type MethodConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive: boolean;
  isPending: boolean;
  controlId: AdminControl;
  warning?: ReactNode;
  confirmDisabled?: boolean;
  confirmText?: string;
  onConfirm: () => void;
};
