import { Bot, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';

export const ApTableControl = () => {
  const { t } = useTranslation();
  const [records, selectedRecords, setSelectedRecords, deleteRecords] =
    useTableState((state) => [
      state.records,
      state.selectedRecords,
      state.setSelectedRecords,
      state.deleteRecords,
    ]);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  return (
    <div className="flex flex-row items-center p-2 my-2 border rounded-lg w-fit">
      <span className="text-sm font-light px-2">
        {selectedRecords.size > 0 ? `${selectedRecords.size} ` : ''}{' '}
        {selectedRecords.size === 1 ? t('row selected') : t('rows selected')}
      </span>
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
      <Button
        variant="ghost"
        className="flex gap-2 px-2 items-center font-light"
        disabled={!userHasTableWritePermission}
      >
        <Bot className="size-4" />
        {t('Re-run AI agent')}
      </Button>
    </div>
  );
};
