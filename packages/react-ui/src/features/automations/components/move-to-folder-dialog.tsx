import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderDto, UncategorizedFolderId } from '@activepieces/shared';

type MoveToFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderDto[] | undefined;
  selectedFolderId: string;
  onFolderChange: (folderId: string) => void;
  onConfirm: () => void;
  isMoving: boolean;
};

export const MoveToFolderDialog = ({
  open,
  onOpenChange,
  folders,
  selectedFolderId,
  onFolderChange,
  onConfirm,
  isMoving,
}: MoveToFolderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Move to Folder')}</DialogTitle>
        </DialogHeader>
        <Select value={selectedFolderId} onValueChange={onFolderChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('Select a folder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UncategorizedFolderId}>
              {t('Uncategorized (No Folder)')}
            </SelectItem>
            {folders?.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedFolderId || isMoving}
            loading={isMoving}
          >
            {t('Move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
