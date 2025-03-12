import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn, NEW_TABLE_QUERY_PARAM } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import ApTableName from './ap-table-name';
import { useTableState } from './ap-table-state-provider';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';

type ApTableHeaderProps = {
  isFetchingNextPage: boolean;
};
const ApTableHeader = ({ isFetchingNextPage }: ApTableHeaderProps) => {
  const [isSaving, selectedRows, setSelectedRows, deleteRecords] =
    useTableState((state) => [
      state.isSaving,
      state.selectedRows,
      state.setSelectedRows,
      state.deleteRecords,
    ]);
  const [searchParams] = useSearchParams();
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );

  const [isEditingTableName, setIsEditingTableName] = useState(false);
  useEffect(() => {
    setIsEditingTableName(searchParams.get(NEW_TABLE_QUERY_PARAM) === 'true');
  }, []);

  const tableData = useTableState((state) => state.table);
  return (
    <div className="flex flex-col gap-4 flex-none">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Link to="/tables" className="text-sm font-medium">
            <h1 className="text-2xl font-semibold">Tables</h1>
          </Link>
          <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          <ApTableName
            tableName={tableData?.name ?? ''}
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
          {/* Left side content can go here */}
        </div>

        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <PermissionNeededTooltip
              hasPermission={userHasTableWritePermission}
            >
              <ConfirmationDeleteDialog
                title={t('Delete Records')}
                message={t(
                  'Are you sure you want to delete the selected records? This action cannot be undone.',
                )}
                entityName={
                  selectedRows.size === 1 ? t('record') : t('records')
                }
                mutationFn={async () => {
                  deleteRecords(Array.from(selectedRows));
                  setSelectedRows(new Set());
                }}
              >
                <Button
                  size="sm"
                  className={cn(
                    selectedRows.size > 0 ? 'visible' : 'invisible',
                  )}
                  variant="destructive"
                  disabled={!userHasTableWritePermission}
                >
                  <Trash2 className="mr-2 w-4" />
                  {`${t('Delete')} (${selectedRows.size})`}
                </Button>
              </ConfirmationDeleteDialog>
            </PermissionNeededTooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

ApTableHeader.displayName = '   ';

export default ApTableHeader;
