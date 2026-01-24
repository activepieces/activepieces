import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { User } from 'lucide-react';

import {
  AppConnectionOwners,
  UserWithMetaInformation,
  validateIndexBound,
} from '@activepieces/shared';

import { ApAvatar } from '../components/custom/ap-avatar';
import { useEmbedding } from '../components/embed-provider';
import {
  DataTableFilters,
  DataWithId,
  RowDataWithActions,
} from '../components/ui/data-table';
import { DataTableColumnHeader } from '../components/ui/data-table/data-table-column-header';

function useOwnerColumn<T extends HasOwner | HasOwnerId>(
  columns: ColumnDef<RowDataWithActions<T>, unknown>[],
  index: number,
): ColumnDef<RowDataWithActions<T>, unknown>[] {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  console.log('isEmbedded', isEmbedded);
  if (isEmbedded) {
    return columns;
  }

  const ownerColumn: ColumnDef<RowDataWithActions<T>, unknown> = {
    accessorKey: 'owner',
    size: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Owner')} icon={User} />
    ),
    cell: ({ row }) => {
      if ('ownerId' in row.original) {
        return <OwnerColumn ownerId={row.original.ownerId} />;
      } else if ('owner' in row.original) {
        return <OwnerColumn ownerId={row.original.owner?.id} />;
      }
      return <div className="text-left">-</div>;
    },
  };
  const safeIndex = validateIndexBound({ index, limit: columns.length });
  return [
    ...columns.slice(0, safeIndex),
    ownerColumn,
    ...columns.slice(safeIndex),
  ];
}

function useOwnerColumnFilter<
  T extends { owner?: UserWithMetaInformation | null | undefined },
>(
  filters: DataTableFilters<keyof T & string>[],
  index: number,
  owners: AppConnectionOwners[] | undefined,
): DataTableFilters<keyof T & string>[] {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  if (isEmbedded) {
    return filters;
  }

  const ownersOptions = owners?.map((owner) => ({
    label: `${owner.firstName} ${owner.lastName} (${owner.email})`,
    value: owner.email,
  }));
  const ownerColumnFilter: DataTableFilters<keyof T & string> = {
    type: 'select',
    title: t('Owner'),
    accessorKey: 'owner',
    icon: User,
    options: ownersOptions ?? [],
  };
  const safeIndex = validateIndexBound({ index, limit: filters.length });
  return [
    ...filters.slice(0, safeIndex),
    ownerColumnFilter,
    ...filters.slice(safeIndex),
  ];
}

export const ownerColumnHooks = {
  useOwnerColumn,
  useOwnerColumnFilter,
};

type HasOwner = {
  owner?: UserWithMetaInformation | null | undefined;
} & DataWithId;
type HasOwnerId = { ownerId?: string | null | undefined } & DataWithId &
  DataWithId;

const OwnerColumn = ({ ownerId }: { ownerId: string | null | undefined }) => {
  return (
    <div className="text-left">
      {ownerId && (
        <ApAvatar
          id={ownerId}
          includeAvatar={true}
          includeName={true}
          size="small"
        />
      )}
      {!ownerId && <div className="text-left">-</div>}
    </div>
  );
};
