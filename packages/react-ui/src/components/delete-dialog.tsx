import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { toast } from './ui/use-toast';

type ConfirmationDeleteDialogProps = {
  title: string;
  message: React.ReactNode;
  children: React.ReactNode;
  entityName: string;
  mutationFn: () => Promise<void>;
  onError?: (error: Error) => void;
  isDanger?: boolean;
};

export function ConfirmationDeleteDialog({
  children,
  message,
  title,
  mutationFn,
  entityName,
  onError,
  isDanger = false,
}: ConfirmationDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isPending, mutate } = useMutation({
    mutationFn,
    onSuccess: () => {
      toast({
        title: t('Removed {entityName}', { entityName }),
      });
      setIsOpen(false);
    },
    onError,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsOpen(false);
            }}
          >
            {t('Close')}
          </Button>
          <Button
            loading={isPending}
            variant={'destructive'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            {isDanger && <TriangleAlert className="size-4 mr-2" />}
            {t('Remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
