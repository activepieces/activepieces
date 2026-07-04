import { FolderDto, UncategorizedFolderId } from '@activepieces/shared';
import { t } from 'i18next';
import { FolderIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
          <DialogDescription>
            {t('Choose a destination folder for the selected items.')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>{t('Folder')}</Label>
          <Select value={selectedFolderId} onValueChange={onFolderChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('Select a folder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UncategorizedFolderId}>
                <FolderIcon className="mr-2 h-4 w-4" />
                {t('Uncategorized (No Folder)')}
              </SelectItem>
              {folders?.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <FolderIcon className="mr-2 h-4 w-4" />
                  {folder.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
