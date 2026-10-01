import { Permission } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  ChevronDown,
  RefreshCw,
  Trash2,
  Download,
  UploadCloud,
  Edit2,
  Import,
  FileJson,
  Lock,
} from 'lucide-react';
import { useState } from 'react';

import { ActiveUsersWidget } from '@/components/custom/active-users-widget';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import EditableText from '@/components/custom/editable-text';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PushToGitDialog } from '@/features/project-releases/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/project-releases/hooks/git-sync-hooks';
import {
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { downloadFile } from '@/lib/dom-utils';

import { tablesApi } from '../api/tables-api';
import { tablesUtils } from '../utils/utils';

import { useRefreshTableState, useTableState } from './ap-table-state-provider';
import { ImportTableDialog } from './import-table-dialog';

interface ApTableHeaderProps {
  onBack: () => void;
  lockedBy: { userId: string; userDisplayName: string } | null;
  takeOver: () => void;
}

export function ApTableHeader({
  onBack,
  lockedBy,
  takeOver,
}: ApTableHeaderProps) {
  const { embedState } = useEmbedding();
  const [
    selectedRecords,
    setSelectedRecords,
    isSaving,
    records,
    table,
    renameTable,
    deleteRecords,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.isSaving,
    state.records,
    state.table,
    state.renameTable,
    state.deleteRecords,
  ]);
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] = useState(false);
  // refresh in place after an import; a full-page reload would break the
  // embed SDK handshake inside an iframe
  const refreshTableState = useRefreshTableState();
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const { project } = projectCollectionUtils.useCurrentProject();
  const lockedByOtherUser = useTableState((state) => state.lockedByOtherUser);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !lockedByOtherUser;
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const showPushToGit = gitSyncHooks.useShowPushToGit();

  const exportTemplate = async () => {
    const tableTemplate = await tablesApi.getTemplate(table.id);
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

  const titleContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={onBack}
            className="cursor-pointer font-normal"
          >
            {getProjectName(project)}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <div className="flex items-center gap-1">
              <EditableText
                className="hover:cursor-text"
                value={table?.name || t('Table Editor')}
                readonly={!canEdit}
                onValueChange={(newName) => {
                  renameTable(newName);
                }}
                isEditing={isEditingTableName}
                setIsEditing={setIsEditingTableName}
                tooltipContent={canEdit ? t('Edit Table Name') : ''}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs">
                    <ChevronDown className="text-gray-11" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => setIsEditingTableName(true), 300);
                    }}
                    disabled={!canEdit}
                  >
                    <Edit2 />
                    {t('Rename')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setIsImportTableDialogOpen(true)}
                    disabled={!canEdit}
                  >
                    <Import />
                    {t('Import')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={exportTemplate}>
                    <FileJson />
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
                            <UploadCloud />
                            {t('Push to Git')}
                          </DropdownMenuItem>
                        </PushToGitDialog>
                      </PermissionNeededTooltip>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {!showPushToGit && <DropdownMenuSeparator />}
                  <DropdownMenuItem onSelect={downloadCsv}>
                    <Download />
                    {t('Download Data')}
                  </DropdownMenuItem>
                  <PermissionNeededTooltip hasPermission={canEdit}>
                    <ConfirmDialog
                      title={t('Delete {name}?', { name: table.name })}
                      description={t(
                        'This will permanently delete the table and all its data.',
                      )}
                      confirmLabel={t('Delete')}
                      onConfirm={async () => {
                        await tablesApi.delete(table.id);
                        onBack();
                      }}
                    >
                      <DropdownMenuItem
                        disabled={!canEdit}
                        onSelect={(e) => e.preventDefault()}
                        onClick={(e) => e.stopPropagation()}
                        variant="destructive"
                      >
                        <Trash2 />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </ConfirmDialog>
                  </PermissionNeededTooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4">
      <div className="flex min-w-0 flex-1 items-center text-sm font-semibold">
        {titleContent}
      </div>
      {isSaving && (
        <div className="flex items-center gap-2 text-gray-11 animate-in fade-in">
          <RefreshCw className="size-4 animate-spin" />
          <span className="text-sm">{t('Saving...')}</span>
        </div>
      )}
      {lockedBy && (
        <div className="flex h-8 items-center gap-2 rounded-lg border border-warning-7 px-3 text-sm text-warning-11">
          <Lock className="size-3.5 shrink-0" />
          <span>
            {t('{name} is editing', { name: lockedBy.userDisplayName })}
          </span>
          <span className="text-warning-11/40">|</span>
          <button className="font-medium hover:underline" onClick={takeOver}>
            {t('Take Over')}
          </button>
        </div>
      )}
      {!embedState.hideActiveUsers && (
        <ActiveUsersWidget resourceId={table.id} />
      )}
      {selectedRecords.size > 0 && (
        <PermissionNeededTooltip hasPermission={canEdit}>
          <ConfirmDialog
            title={t('Delete Records')}
            description={t('The selected records will be permanently deleted.')}
            confirmLabel={t('Delete')}
            onConfirm={async () => {
              const indices = Array.from(selectedRecords).map((row) =>
                records.findIndex((r) => r.uuid === row),
              );
              deleteRecords(indices.map((index) => index.toString()));
              setSelectedRecords(new Set());
            }}
          >
            <Button variant="destructive" size="sm" disabled={!canEdit}>
              <Trash2 />
              {t('Delete Records')}{' '}
              {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
            </Button>
          </ConfirmDialog>
        </PermissionNeededTooltip>
      )}
      <Button variant="ghost" size="sm" onClick={downloadCsv}>
        <Download />
        {t('Download Data')}
      </Button>
      <ImportTableDialog
        open={isImportTableDialogOpen}
        setIsOpen={setIsImportTableDialogOpen}
        tableId={table.id}
        allowedFileTypes={['json', 'csv']}
        onImportSuccess={refreshTableState}
      />
    </header>
  );
}
