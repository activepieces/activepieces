import { Tag } from '@activepieces/shared';
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
import { piecesTagMutations } from '@/features/platform-admin';

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

  const { mutate, isPending } = piecesTagMutations.useCreateTag({
    onTagCreated,
    setIsOpen,
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
