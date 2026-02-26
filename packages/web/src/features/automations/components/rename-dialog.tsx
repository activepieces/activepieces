import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type RenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  isRenaming: boolean;
};

export const RenameDialog = ({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  isRenaming,
}: RenameDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Rename')}</DialogTitle>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('Enter new name')}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!value.trim() || isRenaming}
            loading={isRenaming}
          >
            {t('Rename')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
