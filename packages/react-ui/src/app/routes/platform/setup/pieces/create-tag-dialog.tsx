import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { piecesTagsApi } from '@/features/platform-admin-panel/lib/pieces-tags';
import { Tag } from '@activepieces/shared';

type CreateTagDialogProps = {
  onTagCreated: (tag: Tag) => void;
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function CreateTagDialog({
  onTagCreated,
  children,
  isOpen,
  setIsOpen,
}: CreateTagDialogProps) {
  const [tagName, setTagName] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (name: string) => piecesTagsApi.upsert({ name }),
    onSuccess: (data) => {
      toast({
        title: t('Tag created'),
        description: t(`Tag "${data.name}" has been created successfully.`),
      });
      onTagCreated(data);
      setIsOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagName.trim()) {
      mutate(tagName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <Label htmlFor="tagName">{t('Tag')}</Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit" loading={isPending}>
              {t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
