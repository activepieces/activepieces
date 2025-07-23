import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';

const ApTableFooter = ({
  fieldsCount,
  recordsCount,
}: {
  fieldsCount: number;
  recordsCount: number;
}) => {
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );
  const recordsPercentage = maxRecords ? (recordsCount / maxRecords) * 100 : 0;
  const fieldsPercentage = maxFields ? (fieldsCount / maxFields) * 100 : 0;
  const selectedRecords = useTableState((state) => state.selectedRecords);
  const hasSelectedRows = selectedRecords.size > 0;
  const areAllRecordsSelected =
    selectedRecords.size === recordsCount && recordsCount > 0;
  return (
    <div className="flex items-center justify-between bg-muted/30 px-2 h-[40px]">
      <div className="flex items-center gap-2">
        <div className="text-sm font-sm mt-1">
          {!areAllRecordsSelected && (
            <>
              {!hasSelectedRows &&
                `${t('recordsCount', {
                  recordsCount,
                })} (${recordsPercentage.toFixed(2)}%)`}{' '}
              {hasSelectedRows &&
                `${t('selected')} ${t('recordsCount', {
                  recordsCount: selectedRecords.size,
                })}`}
            </>
          )}
          {areAllRecordsSelected && t('All records selected')}
        </div>
        |
        <div className="text-sm font-sm mt-1">
          {t('fieldsCount', { fieldsCount })} ({fieldsPercentage.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

ApTableFooter.displayName = 'ApTableFooter';

export { ApTableFooter };
