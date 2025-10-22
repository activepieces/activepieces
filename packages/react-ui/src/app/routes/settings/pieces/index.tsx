import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Package, Trash } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { RequestTrial } from '@/app/components/request-trial';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LockedAlert } from '@/components/ui/locked-alert';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil, PieceType } from '@activepieces/shared';

import { ManagePiecesDialog } from './manage-pieces-dialog';

const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('App')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <PieceIcon
            circle={true}
            size={'md'}
            border={true}
            displayName={row.original.displayName}
            logoUrl={row.original.logoUrl}
            showTooltip={false}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'displayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Display Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Package Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.name}</div>;
    },
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Version')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.version}</div>;
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      if (
        row.original.pieceType === PieceType.CUSTOM &&
        !isNil(row.original.projectId)
      ) {
        return (
          <ConfirmationDeleteDialog
            title={t('Delete {name}', { name: row.original.name })}
            entityName={t('Piece')}
            message={t(
              'This will permanently delete this piece, all steps using it will fail.',
            )}
            mutationFn={async () => {
              row.original.delete();
              await piecesApi.delete(row.original.id!);
            }}
          >
            <div className="flex items-end justify-end">
              <Button variant="ghost" className="size-8 p-0">
                <Trash className="size-4 text-destructive" />
              </Button>
            </div>
          </ConfirmationDeleteDialog>
        );
      }
      return null;
    },
  },
];

const ProjectPiecesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('name') ?? '';
  const { pieces, isLoading, refetch } = piecesHooks.usePieces({
    searchQuery,
  });

  const bulkActions: BulkAction<PieceMetadataModelSummary>[] = useMemo(
    () => [
      {
        render: () => {
          return <ManagePiecesDialog onSuccess={() => refetch()} />;
        },
      },
    ],
    [refetch],
  );

  return (
    <div className="w-fullj flex-col">
      <DashboardPageHeader
        title={t('Pieces')}
        description={'Manage project pieces'}
      />
      {!platform.plan.managePiecesEnabled && (
        <LockedAlert
          title={t('Control Pieces')}
          description={t(
            "Show the pieces that matter most to your users and hide the ones you don't like.",
          )}
          button={
            <RequestTrial
              featureKey="ENTERPRISE_PIECES"
              buttonVariant="outline-primary"
            />
          }
        />
      )}
      <DataTable
        emptyStateTextTitle={t('No pieces found')}
        emptyStateTextDescription={t(
          'Add a piece to your project that you want to use in your automations',
        )}
        emptyStateIcon={<Package className="size-14" />}
        columns={columns}
        filters={[
          {
            type: 'input',
            title: t('Piece Name'),
            accessorKey: 'name',
            icon: CheckIcon,
          },
        ]}
        page={{
          data: pieces ?? [],
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        hidePagination={true}
        bulkActions={platform.plan.managePiecesEnabled ? bulkActions : []}
      />
    </div>
  );
};

ProjectPiecesPage.displayName = 'ProjectPiecesPage';
export { ProjectPiecesPage };
