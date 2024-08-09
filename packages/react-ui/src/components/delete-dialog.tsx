import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

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
  message: string;
  children: React.ReactNode;
  entityName: string;
  mutationFn: () => Promise<void>;
};
export function ConfirmationDeleteDialog({
  children,
  message,
  title,
  mutationFn,
  entityName,
}: ConfirmationDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isPending, mutate } = useMutation({
    mutationFn,
    onSuccess: () => {
      toast({
        title: `Removed ${entityName}`,
      });
      setIsOpen(false);
    },
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
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Close
          </Button>
          <Button
            loading={isPending}
            variant={'destructive'}
            onClick={() => {
              mutate();
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
