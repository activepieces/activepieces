import { t } from 'i18next';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { FolderDto } from '@activepieces/shared';

import { foldersApi } from '../../lib/folders-api';
import { RenameFolderDialog } from '../rename-folder-dialog';

export type FolderActionProps = {
  folder: FolderDto;
  refetch: () => void;
  userHasPermissionToUpdateFolders: boolean;
};

export const FolderAction = ({
  folder,
  refetch,
  userHasPermissionToUpdateFolders,
}: FolderActionProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<'rename' | 'delete' | null>(
    null,
  );

  const handleOpenDialog = (dialog: 'rename' | 'delete') => {
    setDialogOpen(dialog);
    setIsDropdownOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(null);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9" size="icon">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFolders}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 w-full justify-start gap-2 items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog('rename');
              }}
            >
              <Pencil className="h-4 w-4" />
              <span>{t('Rename')}</span>
            </Button>
          </PermissionNeededTooltip>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFolders}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 w-full justify-start gap-2 items-center"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog('delete');
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </Button>
          </PermissionNeededTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogOpen === 'rename' && (
        <RenameFolderDialog
          folderId={folder.id}
          name={folder.displayName}
          onRename={refetch}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
        />
      )}

      {dialogOpen === 'delete' && (
        <ConfirmationDeleteDialog
          title={t('Delete {folderName}', {
            folderName: folder.displayName,
          })}
          message={t(
            'If you delete this folder, we will keep its flows and move them to Uncategorized.',
          )}
          mutationFn={async () => {
            console.info('HEllo');
            await foldersApi.delete(folder.id);
            refetch();
          }}
          entityName={folder.displayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
          }}
        />
      )}
    </>
  );
}; 