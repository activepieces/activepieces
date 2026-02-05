import { t } from 'i18next';
import {
  Download,
  PencilIcon,
  TrashIcon,
  UploadCloud,
  Import,
  FileJson,
} from 'lucide-react';
import React, { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PushToGitDialog } from '@/features/project-releases/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/project-releases/lib/git-sync-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission, Table } from '@activepieces/shared';

import { tablesApi } from '../lib/tables-api';
import { tablesUtils } from '../lib/utils';

import { ImportTableDialog } from './import-table-dialog';
import RenameTableDialog from './rename-table-dialog';

const ApTableActionsMenu = ({
  table,
  refetch,
  onDelete,
  children,
}: {
  table: Table;
  refetch: (() => void) | null;
  onDelete?: () => void;
  children: React.ReactNode;
}) => {
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = useState(false);
  const userHasPermissionToUpdateTable = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const showPushToGit = gitSyncHooks.useShowPushToGit();

  const exportTemplate = async () => {
    const tableTemplate = await tablesApi.getTemplate(table.id);
    const { downloadFile } = await import('@/lib/utils');
    downloadFile({
      obj: JSON.stringify(tableTemplate, null, 2),
      fileName: tableTemplate.name,
      extension: 'json',
    });
  };

  const downloadCsv = async () => {
    const exportedTable = await tablesApi.export(table.id);
    tablesUtils.exportTables([exportedTable]);
  };
  return (
    <>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateTable}
          >
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
                onClick={(e) => e.stopPropagation()}
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

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setIsImportTableDialogOpen(true)}>
            <Import className="mr-2 h-4 w-4" />
            {t('Import')}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={exportTemplate}>
            <FileJson className="mr-2 h-4 w-4" />
            {t('Export Template')}
          </DropdownMenuItem>

          {showPushToGit && (
            <>
              <DropdownMenuSeparator />
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToPushToGit}
              >
                <PushToGitDialog type="table" tables={[table]}>
                  <DropdownMenuItem
                    disabled={!userHasPermissionToPushToGit}
                    onSelect={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {t('Push to Git')}
                  </DropdownMenuItem>
                </PushToGitDialog>
              </PermissionNeededTooltip>
              <DropdownMenuSeparator />
            </>
          )}
          {!showPushToGit && <DropdownMenuSeparator />}

          <DropdownMenuItem onSelect={downloadCsv}>
            <Download className="mr-2 h-4 w-4" />
            {t('Download Data')}
          </DropdownMenuItem>

          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateTable}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateTable}
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <ConfirmationDeleteDialog
                title={`${t('Delete')} ${table.name}`}
                message={t(
                  'Are you sure you want to delete the selected tables? This action cannot be undone.',
                )}
                entityName={table.name}
                mutationFn={async () => {
                  await tablesApi.delete(table.id);
                  onDelete?.();
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
      <ImportTableDialog
        open={isImportTableDialogOpen}
        setIsOpen={setIsImportTableDialogOpen}
        showTrigger={false}
        tableId={table.id}
        allowedFileTypes={['json', 'csv']}
        onImportSuccess={() => {
          refetch?.();
        }}
      />
    </>
  );
};

ApTableActionsMenu.displayName = 'ApTableActionsMenu';
export { ApTableActionsMenu };
