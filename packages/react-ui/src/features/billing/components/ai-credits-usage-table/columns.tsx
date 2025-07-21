import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { ListAICreditsUsageResponse } from '@activepieces/shared';

export const aiCreditUsageTableColumns: ColumnDef<ListAICreditsUsageResponse>[] =
  [
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Date')} />
      ),
      cell: ({ row }) => {
        const date = row.getValue('created') as string;
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(date))}
          </div>
        );
      },
    },
    {
      accessorKey: 'projectName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.getValue('projectName')}</div>;
      },
    },
    {
      accessorKey: 'provider',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Provider')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <span>{row.getValue('provider')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'model',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Model')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.getValue('model')}</div>;
      },
    },
    {
      accessorKey: 'credits',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Credits')} />
      ),
      cell: ({ row }) => {
        const credits = row.getValue('credits') as number;
        return (
          <div className="text-left">{formatUtils.formatNumber(credits)}</div>
        );
      },
    },
  ];
