import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CreateDropdownOptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (displayName: string) => Promise<void>;
  title: string;
};

function CreateDropdownOptionForm({
  onOpenChange,
  onSubmit,
}: Omit<CreateDropdownOptionDialogProps, 'open' | 'title'>) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    try {
      await onSubmit(displayName.trim());
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">{t('Name')}</Label>
          <Input
            id="displayName"
            ref={inputRef}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('Enter a name')}
            autoFocus
          />
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {t('Cancel')}
        </Button>
        <Button type="submit" loading={loading} disabled={!displayName.trim()}>
          {t('Create')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateDropdownOptionDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
}: CreateDropdownOptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <CreateDropdownOptionForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
