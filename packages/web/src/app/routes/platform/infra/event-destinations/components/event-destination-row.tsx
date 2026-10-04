import { EventDestination } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe, Workflow } from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  DateCell,
  NameCell,
  TagsCell,
} from '@/components/custom/list/list-cells';
import { RowMenu, RowMenuItem } from '@/components/custom/list/row-menu';

import { ParsedDestination } from '../lib/parse-flow-id-from-url';
import { EventLabelsMap } from '../lib/use-event-labels';

export const eventDestinationColumns = ({
  eventLabels,
  menuItems,
}: {
  eventLabels: EventLabelsMap;
  menuItems: (row: DestinationRow) => RowMenuItem[];
}): ColumnDef<RowDataWithActions<DestinationRow>>[] => [
  {
    accessorKey: 'destination',
    size: 460,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Destination')} />
    ),
    cell: ({ row }) => {
      const isFlow = row.original.parsed.kind === 'flow';
      return (
        <NameCell
          media={
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11 [&_svg]:size-3.5">
              {isFlow ? <Workflow /> : <Globe />}
            </span>
          }
          title={destinationTitle({ row: row.original })}
          sub={isFlow ? t('Flow on this platform') : t('Webhook you own')}
        />
      );
    },
  },
  {
    accessorKey: 'events',
    size: 320,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Events')} />
    ),
    cell: ({ row }) => (
      <TagsCell
        tags={row.original.destination.events.map(
          (event) => eventLabels[event]?.label ?? event,
        )}
      />
    ),
  },
  {
    accessorKey: 'created',
    size: 112,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => (
      <DateCell value={row.original.destination.created} mode="short" />
    ),
  },
  {
    id: 'actions',
    size: 56,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowMenu items={menuItems(row.original)} />
      </div>
    ),
  },
];

function destinationTitle({ row }: { row: DestinationRow }): string {
  if (row.parsed.kind !== 'flow') {
    return row.destination.url;
  }
  return (
    row.flowDisplayName ??
    t('Destination (flow {flowId})', { flowId: row.parsed.flowId })
  );
}

export type DestinationRow = {
  id: string;
  destination: EventDestination;
  parsed: ParsedDestination;
  flowDisplayName: string | undefined;
};
