import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';

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
    <div className="flex h-10 shrink-0 items-center justify-between border-t bg-gray-2 px-4">
      <div className="flex items-center gap-2 text-xs text-gray-11 tabular-nums">
        <div>
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
        <span className="text-gray-9">|</span>
        <div>
          {t('fieldsCount', { fieldsCount })} ({fieldsPercentage.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

ApTableFooter.displayName = 'ApTableFooter';

export { ApTableFooter };
