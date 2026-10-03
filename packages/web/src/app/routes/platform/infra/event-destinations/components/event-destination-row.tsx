import { EventDestination } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe, Workflow } from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import { MutedCell, NameCell } from '@/components/custom/list/list-cells';
import { listFormat } from '@/components/custom/list/list-format';
import { ParsedDestination } from '../lib/parse-flow-id-from-url';
import { EventLabelsMap } from '../lib/use-event-labels';

export const eventDestinationColumns = ({
  eventLabels,
}: {
  eventLabels: EventLabelsMap;
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
    cell: ({ row }) => {
      const events = row.original.destination.events;
      const shown = events.slice(0, 2);
      const extra = events.length - shown.length;
      return (
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          {shown.map((event) => (
            <Badge key={event} variant="outline" className="shrink-0">
              {eventLabels[event]?.label ?? event}
            </Badge>
          ))}
          {extra > 0 && (
            <span className="shrink-0 text-xs text-gray-11 tabular-nums">
              {`+${extra}`}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => (
      <MutedCell>
        {listFormat.shortDate(row.original.destination.created)}
      </MutedCell>
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
