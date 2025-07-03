import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';

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

import { toast } from './ui/use-toast';

interface ConfirmationDeleteDialogProps {
  title: string;
  message: React.ReactNode | string;
  mutationFn: () => Promise<void>;
  entityName: string;
  children?: React.ReactNode;
  open?: boolean;
  isDanger?: boolean;
  buttonText?: string;
  onOpenChange?: (open: boolean) => void;
  showToast?: boolean;
  onError?: (error: Error) => void;
}

export const ConfirmationDeleteDialog = ({
  title,
  message,
  mutationFn,
  showToast,
  isDanger,
  entityName,
  buttonText,
  children,
  open,
  onError,
  onOpenChange,
}: ConfirmationDeleteDialogProps) => {
  const [isControlled] = useState(
    open !== undefined && onOpenChange !== undefined,
  );
  const [isUncontrolledOpen, setIsUncontrolledOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn,
    onSuccess: () => {
      handleClose();
      if (showToast) {
        toast({
          title: t('Removed {entityName}', { entityName }),
        });
      }
    },
    onError,
  });

  const handleClose = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setIsUncontrolledOpen(false);
    }
  };

  const isOpen = isControlled ? open : isUncontrolledOpen;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={isControlled ? onOpenChange : setIsUncontrolledOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => handleClose()}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={() => mutate()}
          >
            {isDanger && <TriangleAlert className="size-4 mr-2" />}
            {buttonText || t('Remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
