import { t } from 'i18next';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { FolderDto, Permission } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';

import { RenameFolderDialog } from './rename-folder-dialog';

type FolderActionsProps = {
  folder: FolderDto;
  refetch: () => void;
};

export const FolderActions = ({ folder, refetch }: FolderActionsProps) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center justify-center relative ml-auto"
    >
      <span
        className={cn(
          'text-muted-foreground !text-xs !font-semibold self-end transition-opacity duration-150',
          buttonVariants({ size: 'icon', variant: 'ghost' }),
          {
            'opacity-100': !userHasPermissionToUpdateFolders,
            'opacity-100 group-hover/item:opacity-0':
              userHasPermissionToUpdateFolders && !isActionMenuOpen,
            'opacity-0': userHasPermissionToUpdateFolders && isActionMenuOpen,
          },
        )}
      >
        {folder.numberOfFlows}
      </span>
      {userHasPermissionToUpdateFolders && (
        <DropdownMenu onOpenChange={setIsActionMenuOpen} modal={true}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute inset-0 transition-opacity duration-150',
                {
                  'opacity-0 group-hover/item:opacity-100': !isActionMenuOpen,
                  'opacity-100': isActionMenuOpen,
                },
              )}
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToUpdateFolders}
            >
              <RenameFolderDialog
                folderId={folder.id}
                name={folder.displayName}
                onRename={() => refetch()}
              >
                <DropdownMenuItem
                  disabled={!userHasPermissionToUpdateFolders}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Pencil className="h-4 w-4" />
                    <span>{t('Rename')}</span>
                  </div>
                </DropdownMenuItem>
              </RenameFolderDialog>
            </PermissionNeededTooltip>
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToUpdateFolders}
            >
              <ConfirmationDeleteDialog
                title={t('Delete {folderName}', {
                  folderName: folder.displayName,
                })}
                message={t(
                  'If you delete this folder, we will keep its flows and move them to Uncategorized.',
                )}
                mutationFn={async () => {
                  await foldersApi.delete(folder.id);
                  refetch();
                }}
                entityName={folder.displayName}
              >
                <DropdownMenuItem
                  disabled={!userHasPermissionToUpdateFolders}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{t('Delete')}</span>
                  </div>
                </DropdownMenuItem>
              </ConfirmationDeleteDialog>
            </PermissionNeededTooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
