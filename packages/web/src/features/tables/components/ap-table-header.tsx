import { Permission } from '@activepieces/shared';
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
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import EditableText from '@/components/custom/editable-text';
import { PageHeader } from '@/components/custom/page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
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

import { useTableState } from './ap-table-state-provider';
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
          <BreadcrumbLink onClick={onBack} className="cursor-pointer">
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
                  <Button
                    variant="ghost"
                    className="size-6 flex items-center justify-center"
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => setIsEditingTableName(true), 300);
                    }}
                    disabled={!canEdit}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    {t('Rename')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setIsImportTableDialogOpen(true)}
                    disabled={!canEdit}
                  >
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
                  <PermissionNeededTooltip hasPermission={canEdit}>
                    <ConfirmationDeleteDialog
                      title={t('Delete Table')}
                      message={t(
                        'This will permanently delete the table and all its data.',
                      )}
                      entityName={t('table')}
                      buttonText={t('Delete')}
                      mutationFn={async () => {
                        await tablesApi.delete(table.id);
                        onBack();
                      }}
                    >
                      <DropdownMenuItem
                        disabled={!canEdit}
                        onSelect={(e) => e.preventDefault()}
                        onClick={(e) => e.stopPropagation()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </ConfirmationDeleteDialog>
                  </PermissionNeededTooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  const rightContent = (
    <div className="flex items-center gap-2">
      {isSaving && (
        <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">{t('Saving...')}</span>
        </div>
      )}
      {lockedBy && (
        <div className="flex items-center gap-1.5 border border-warning/50 rounded-md px-2.5 py-1 text-sm text-warning-700 dark:text-warning-300">
          <Lock className="size-3.5 shrink-0" />
          <span>
            {t('{name} is editing', { name: lockedBy.userDisplayName })}
          </span>
          <span className="text-warning/40">|</span>
          <button className="hover:underline font-medium" onClick={takeOver}>
            {t('Take Over')}
          </button>
        </div>
      )}
      <ActiveUsersWidget resourceId={table.id} />
      {selectedRecords.size > 0 && (
        <PermissionNeededTooltip hasPermission={canEdit}>
          <ConfirmationDeleteDialog
            title={t('Delete Records')}
            message={t('The selected records will be permanently deleted.')}
            entityName={selectedRecords.size === 1 ? t('record') : t('records')}
            buttonText={t('Delete')}
            mutationFn={async () => {
              const indices = Array.from(selectedRecords).map((row) =>
                records.findIndex((r) => r.uuid === row),
              );
              deleteRecords(indices.map((index) => index.toString()));
              setSelectedRecords(new Set());
            }}
          >
            <Button
              variant="destructive"
              className="flex gap-2 items-center"
              disabled={!canEdit}
            >
              <Trash2 className="size-4" />
              {t('Delete Records')}{' '}
              {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
            </Button>
          </ConfirmationDeleteDialog>
        </PermissionNeededTooltip>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title={titleContent}
        rightContent={rightContent}
        className="gap-1 justify-between px-4"
      />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="flex gap-2 items-center"
          onClick={downloadCsv}
        >
          <Download className="size-4" />
          {t('Download Data')}
        </Button>
        <ImportTableDialog
          open={isImportTableDialogOpen}
          setIsOpen={setIsImportTableDialogOpen}
          tableId={table.id}
          allowedFileTypes={['json', 'csv']}
          onImportSuccess={() => window.location.reload()}
        />
      </div>
    </>
  );
}
