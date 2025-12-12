import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { EllipsisVertical } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import FlowActionMenu from '@/app/components/flow-actions-menu';
import { Button } from '@/components/ui/button';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { PopulatedFlow } from '@activepieces/shared';

type FlowsTableColumnsProps = {
  refetch: () => void;
  refresh: number;
  setRefresh: Dispatch<SetStateAction<number>>;
};

export const flowsTableColumns = ({
  refetch,
  refresh,
  setRefresh,
}: FlowsTableColumnsProps): (ColumnDef<RowDataWithActions<PopulatedFlow>> & {
  accessorKey: string;
})[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} />
    ),
    cell: ({ row }) => {
      const displayName = row.original.version.displayName;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-left truncate max-w-[250px]">
              {displayName}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{displayName}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'steps',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Steps')} />
    ),
    cell: ({ row }) => {
      return (
        <PieceIconList
          trigger={row.original.version.trigger}
          maxNumberOfIconsToShow={2}
        />
      );
    },
  },
  {
    accessorKey: 'updated',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Last modified')} />
    ),
    cell: ({ row }) => {
      const updated = row.original.updated;
      return (
        <FormattedDate
          date={new Date(updated)}
          className="text-left font-medium min-w-[150px]"
        />
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      return (
        <div
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FlowStatusToggle flow={row.original}></FlowStatusToggle>
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const flow = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <FlowActionMenu
            insideBuilder={false}
            onVersionsListClick={null}
            flow={flow}
            readonly={false}
            flowVersion={flow.version}
            onRename={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
            onMoveTo={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
            onDuplicate={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
            onDelete={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
          >
            <Button variant="ghost" size="icon" className="mr-8">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </FlowActionMenu>
        </div>
      );
    },
  },
  {
    accessorKey: 'connectionExternalId',
    enableHiding: true,
  },
];
