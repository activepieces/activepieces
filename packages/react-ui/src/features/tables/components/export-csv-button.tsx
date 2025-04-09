import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { DownloadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { tablesApi } from '../lib/tables-api';
import { tablesUtils } from '../lib/utils';

import { useTableState } from './ap-table-state-provider';

const ExportCsvButton = () => {
  const [table] = useTableState((state) => [state.table]);
  const { mutateAsync: exportTable, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const exportedTable = await tablesApi.export(table.id);
      tablesUtils.exportTables([exportedTable]);
    },
  });
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex gap-2 items-center"
      onClick={() => {
        exportTable();
      }}
      loading={isLoading}
    >
      <DownloadIcon className="w-4 h-4 shrink-0" />
      {t('Export')}
    </Button>
  );
};

ExportCsvButton.displayName = 'ExportCsvButton';

export { ExportCsvButton };
