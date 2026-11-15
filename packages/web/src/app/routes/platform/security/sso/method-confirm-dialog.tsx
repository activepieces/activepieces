import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { ReactNode } from 'react';

import { adminLayout } from '@/app/components/admin';
import {
  TypeToConfirm,
  useTypeToConfirm,
} from '@/components/custom/type-to-confirm';
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
  const typed = useTypeToConfirm({ open, text: confirmText });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            value={typed.value}
            onChange={typed.setValue}
          />
        )}
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
            disabled={confirmDisabled || !typed.confirmed}
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
