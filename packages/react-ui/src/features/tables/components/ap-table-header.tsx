import { t } from 'i18next';
import {
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  Trash2,
  Import,
  Download,
} from 'lucide-react';
import { useState } from 'react';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditableText from '@/components/ui/editable-text';
import { useAuthorization } from '@/hooks/authorization-hooks';
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
  const { embedState } = useEmbedding();
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );

  const exportTable = async () => {
    const { tablesApi } = await import('../lib/tables-api');
    const { tablesUtils } = await import('../lib/utils');
    const exportedTable = await tablesApi.export(table.id);
    tablesUtils.exportTables([exportedTable]);
  };

  return (
    <>
      <div className="flex items-center gap-1 justify-between p-4 w-full">
        <div className="flex items-center gap-2">
          {!embedState.isEmbedded && <ApSidebarToggle />}
          {embedState.isEmbedded && (
            <Button
              variant="basic"
              size={'icon'}
              className="text-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="flex items-center gap-1">
            <EditableText
              className="text-lg font-semibold hover:cursor-text"
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
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('Saving...')}</span>
            </div>
          )}
          {selectedRecords.size > 0 && (
            <PermissionNeededTooltip
              hasPermission={userHasTableWritePermission}
            >
              <ConfirmationDeleteDialog
                title={t('Delete Records')}
                message={t(
                  'Are you sure you want to delete the selected records? This action cannot be undone.',
                )}
                entityName={
                  selectedRecords.size === 1 ? t('record') : t('records')
                }
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
      </div>
      <div>
        <ImportCsvDialog
          open={isImportCsvDialogOpen}
          setIsOpen={setIsImportCsvDialogOpen}
        />
      </div>
    </>
  );
}
