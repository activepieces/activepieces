import { t } from 'i18next';
import {
  ChevronDown,
  RefreshCw,
  Trash2,
  Import,
  Download,
  UploadCloud,
} from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/custom/page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditableText from '@/components/ui/editable-text';
import { PushToGitDialog } from '@/features/project-releases/components/push-to-git-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  getProjectName,
  projectCollectionUtils,
} from '@/hooks/project-collection';
import { Permission } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';
import { ImportCsvDialog } from './import-csv-dialog';

interface ApTableHeaderProps {
  onBack: () => void;
}

export function ApTableHeader({ onBack }: ApTableHeaderProps) {
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
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const { project } = projectCollectionUtils.useCurrentProject();
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );

  const exportTable = async () => {
    const { tablesApi } = await import('../lib/tables-api');
    const { tablesUtils } = await import('../lib/utils');
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
                readonly={!userHasTableWritePermission}
                onValueChange={(newName) => {
                  renameTable(newName);
                }}
                isEditing={isEditingTableName}
                setIsEditing={setIsEditingTableName}
                tooltipContent={
                  userHasTableWritePermission ? t('Edit Table Name') : ''
                }
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
                    onClick={() => setIsImportCsvDialogOpen(true)}
                  >
                    <Import className="mr-2 h-4 w-4" />
                    {t('Import')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportTable}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('Export')}
                  </DropdownMenuItem>
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
      {selectedRecords.size > 0 && (
        <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
          <ConfirmationDeleteDialog
            title={t('Delete Records')}
            message={t(
              'Are you sure you want to delete the selected records? This action cannot be undone.',
            )}
            entityName={selectedRecords.size === 1 ? t('record') : t('records')}
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
              disabled={!userHasTableWritePermission}
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
        className="gap-1 justify-between"
      />
      <div>
        <ImportCsvDialog
          open={isImportCsvDialogOpen}
          setIsOpen={setIsImportCsvDialogOpen}
        />
      </div>
    </>
  );
}
