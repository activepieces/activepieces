import { UseMutationResult } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Download,
  EllipsisVertical,
  PencilIcon,
  TrashIcon,
  UploadCloud,
} from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { PushToGitDialog } from '@/features/git-sync/components/push-to-git-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission, Table } from '@activepieces/shared';

import { tablesApi } from '../lib/tables-api';
import { tablesUtils } from '../lib/utils';

import RenameTableDialog from './rename-table-dialog';

const ApTableActionsMenu = ({
  table,
  refetch,
  deleteMutation,
}: {
  table: Table;
  refetch: (() => void) | null;
  deleteMutation: UseMutationResult<void, Error, string[], unknown>;
}) => {
  const userHasPermissionToUpdateTable = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <div className="rounded-full p-2 hover:bg-muted cursor-pointer">
          <EllipsisVertical className="h-6 w-6" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateTable}>
          <RenameTableDialog
            tableName={table.name}
            tableId={table.id}
            onRename={() => {
              refetch?.();
            }}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateTable}
              onSelect={(e) => e.preventDefault()}
            >
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateTable}
              >
                <div className="flex items-center gap-2">
                  <PencilIcon className="h-4 w-4" />
                  {t('Rename')}
                </div>
              </PermissionNeededTooltip>
            </DropdownMenuItem>
          </RenameTableDialog>
        </PermissionNeededTooltip>

        <DropdownMenuItem
          onClick={async (e) => {
            const exportedTable = await tablesApi.export(table.id);
            tablesUtils.exportTables([exportedTable]);
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div className="flex gap-2 items-center">
            <Download className="w-4 h-4"></Download>
            {t('Export')}
          </div>
        </DropdownMenuItem>

        <PermissionNeededTooltip hasPermission={userHasPermissionToPushToGit}>
          <PushToGitDialog type="table" tables={[table]}>
            <DropdownMenuItem
              disabled={!userHasPermissionToPushToGit}
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex cursor-pointer flex-row gap-2 items-center">
                <UploadCloud className="h-4 w-4" />
                <span>{t('Push to Git')}</span>
              </div>
            </DropdownMenuItem>
          </PushToGitDialog>
        </PermissionNeededTooltip>

        <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateTable}>
          <DropdownMenuItem
            disabled={!userHasPermissionToUpdateTable}
            onSelect={(e) => e.preventDefault()}
          >
            <ConfirmationDeleteDialog
              title={`${t('Delete')} ${table.name}`}
              message={t(
                'Are you sure you want to delete the selected tables? This action cannot be undone.',
              )}
              entityName={table.name}
              mutationFn={async () => {
                await deleteMutation.mutateAsync([table.id]);
                refetch?.();
              }}
            >
              <div className="flex items-center gap-2 text-destructive">
                <TrashIcon className="h-4 w-4" />
                {t('Delete')}
              </div>
            </ConfirmationDeleteDialog>
          </DropdownMenuItem>
        </PermissionNeededTooltip>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

ApTableActionsMenu.displayName = 'ApTableActionsMenu';
export { ApTableActionsMenu };
