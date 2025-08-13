import { Bot, Import, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { agentRunsApi } from '@/features/agents/lib/agents-api';
import { getSelectedServerRecords } from '@/features/tables/lib/utils';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission, Table } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';
import { ImportCsvDialog } from '@/features/tables/components/import-csv-dialog';
import { useState } from 'react';

type ApTableControlProps = {
  table: Table;
  recordsCount: number;
};

export const ApTableControl = ({
  table,
  recordsCount,
}: ApTableControlProps) => {
  const { t } = useTranslation();
  const [
    records,
    selectedRecords,
    serverRecords,
    setSelectedRecords,
    deleteRecords,
    setRuns,
  ] = useTableState((state) => [
    state.records,
    state.selectedRecords,
    state.serverRecords,
    state.setSelectedRecords,
    state.deleteRecords,
    state.setRuns,
  ]);
  const hasSelectedRows = selectedRecords.size > 0;
  const areAllRecordsSelected =
    selectedRecords.size === recordsCount && recordsCount > 0;
  const { mutate: automateTable } = agentHooks.useAutomate(
    table.id,
    getSelectedServerRecords(selectedRecords, records, serverRecords),
    async () => {
      if (!table.agent?.id) {
        return;
      }
      const updatedRuns = await agentRunsApi.list({
        agentId: table.agent?.id,
        limit: 999999,
        cursor: undefined,
      });
      setRuns(updatedRuns.data);
    },
  );
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  console.log('isImportCsvDialogOpen', isImportCsvDialogOpen);
  return (
    <div className="flex flex-row items-center my-2 rounded-lg w-full justify-between">
        <div className="flex flex-row items-center">
        <span className="text-sm text-muted-foreground p-2">
          {!areAllRecordsSelected && (
              <>
                {!hasSelectedRows &&
                  `${t('recordsCount', {
                    recordsCount,
                  })}`}{' '}
                {hasSelectedRows &&
                  `${t('selected')} ${t('recordsCount', {
                    recordsCount: selectedRecords.size,
                  })}`}
              </>
            )}
          {areAllRecordsSelected && t('All records selected')}
        </span>
        {table.agent?.settings?.aiMode && table.agent?.created !== table.agent?.updated && (
          <Button
            variant="ghost"
            className="flex gap-2 items-center"
            disabled={!userHasTableWritePermission}
            onClick={() => automateTable()}
          >
            <Bot className="size-4" />
            {selectedRecords.size > 0
              ? t(`Run AI agent (${Number(selectedRecords.size)} records)`)
              : t('Run AI agent')}
          </Button>
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
                variant="ghost"
                className="flex gap-2 px-2 items-center font-light text-destructive hover:text-destructive"
                disabled={!userHasTableWritePermission}
              >
                <Trash2 className="size-4" />
                {t('Delete Records')}{' '}
              </Button>
            </ConfirmationDeleteDialog>
          </PermissionNeededTooltip>
        )}
      </div>
      <Button
        variant="ghost"
        className="flex gap-2 mr-2 px-2 items-center justify-center font-light text-muted-foreground hover:text-muted-foreground"
        onClick={() => setIsImportCsvDialogOpen(true)}
      >

        <Import className="size-4 " />
        <span className="text-sm">
          {t('Import Data')}
        </span>
      </Button>
      <ImportCsvDialog
          open={isImportCsvDialogOpen}
          setIsOpen={setIsImportCsvDialogOpen}
        />
    </div>
  );
};
