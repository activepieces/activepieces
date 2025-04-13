import { t } from 'i18next';
import { ChevronDown, DownloadIcon, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HomeButton } from '@/components/ui/home-button';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import { tablesUtils } from '../lib/utils';

import ApTableName from './ap-table-name';
import { useTableState } from './ap-table-state-provider';
import { ImportCsvDialog } from './import-csv-dialog';
import { tablesApi } from '../lib/tables-api';

type ApTableHeaderProps = {
  isFetchingNextPage: boolean;
};
const ApTableHeader = ({ isFetchingNextPage }: ApTableHeaderProps) => {
  const [
    isSaving,
    selectedRecords,
    setSelectedRecords,
    deleteRecords,
    records,
    table,
    fields,
  ] = useTableState((state) => [
    state.isSaving,
    state.selectedRecords,
    state.setSelectedRecords,
    state.deleteRecords,
    state.records,
    state.table,
    state.fields,
  ]);
  const [searchParams] = useSearchParams();
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );

  const [isEditingTableName, setIsEditingTableName] = useState(false);
  useEffect(() => {
    setIsEditingTableName(searchParams.get(NEW_TABLE_QUERY_PARAM) === 'true');
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const exportTable = async () => {
    const exportedTable = await tablesApi.export(table.id);
    tablesUtils.exportTables([exportedTable]);
  };
  return (
    <div className="flex flex-col gap-4 flex-none px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <HomeButton showBackButton={true} route={'/tables'}></HomeButton>

            <ApTableName
              tableName={table.name}
              isEditingTableName={isEditingTableName}
              setIsEditingTableName={setIsEditingTableName}
            />
          </div>

          {isSaving && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('Saving...')}</span>
            </div>
          )}
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('Loading more...')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImportCsvDialog />
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="flex gap-2 items-center">
                    {`${t('Actions')}`}
                    <ChevronDown className="w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <>
                    <DropdownMenuItem
                      onSelect={async () => {
                        await exportTable();
                      }}
                      disabled={selectedRecords.size === 0}
                      className="flex gap-2 items-center"
                    >
                      <DownloadIcon className="size-4"></DownloadIcon>
                      {t('Export Table')}
                    </DropdownMenuItem>
                    <PermissionNeededTooltip
                      hasPermission={userHasTableWritePermission}
                    >
                      <ConfirmationDeleteDialog
                        title={t('Delete Records')}
                        message={t(
                          'Are you sure you want to delete the selected records? This action cannot be undone.',
                        )}
                        entityName={
                          selectedRecords.size === 1
                            ? t('record')
                            : t('records')
                        }
                        mutationFn={async () => {
                          const indices = Array.from(selectedRecords).map(
                            (row) => records.findIndex((r) => r.uuid === row),
                          );
                          deleteRecords(
                            indices.map((index) => index.toString()),
                          );
                          setSelectedRecords(new Set());
                          setIsMenuOpen(false);
                        }}
                      >
                        <DropdownMenuItem
                          className="text-destructive flex gap-2 items-center"
                          onSelect={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          disabled={
                            selectedRecords.size === 0 ||
                            !userHasTableWritePermission
                          }
                        >
                          <Trash2 className="size-4"></Trash2>
                          {t('Delete Records')}{' '}
                          {selectedRecords.size > 0
                            ? `(${selectedRecords.size})`
                            : ''}
                        </DropdownMenuItem>
                      </ConfirmationDeleteDialog>
                    </PermissionNeededTooltip>
                  </>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ApTableHeader.displayName = 'ApTableHeader';

export default ApTableHeader;
