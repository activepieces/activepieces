import { ProjectRole, RoleType } from '@activepieces/core-utils';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Columns3,
  Copy,
  Eye,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  MutedCell,
  NameCell,
  NumberCell,
} from '@/components/custom/list/list-cells';
import {
  CountTabs,
  ListSearch,
  ListToolbar,
} from '@/components/custom/list/list-toolbar';
import { RowMenu, RowMenuItem } from '@/components/custom/list/row-menu';
import { useUrlParam } from '@/components/custom/list/use-url-param';
import { Page, PageSection } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { roleCopy } from '@/features/members/lib/role-copy';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { DeleteRoleDialog } from './delete-role-dialog';
import { NewRoleDialog } from './new-role-dialog';
import { PlatformRolesList } from './platform-roles-list';
import { RoleAvatar } from './role-avatar';
import { LockedRoleButton } from './role-lock';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [kind, setKind] = useUrlParam<RoleKind>({
    key: 'type',
    fallback: 'all',
    allowed: ROLE_KINDS,
  });
  const [creating, setCreating] = useState<{ startFromId?: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<ProjectRole | null>(null);

  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);
  const isSample = !platform.plan.projectRolesEnabled;
  const canCustomize = platform.plan.customRolesEnabled;
  const allRoles = useMemo(
    () =>
      roleCopy.sortProjectRoles({
        roles: (isSample ? sampleData.projectRolesPage() : data)?.data ?? [],
      }),
    [isSample, data],
  );
  const counts = {
    all: allRoles.length,
    builtIn: allRoles.filter((role) => role.type === RoleType.DEFAULT).length,
    custom: allRoles.filter((role) => role.type !== RoleType.DEFAULT).length,
  };
  const rows = allRoles.filter(
    (role) =>
      (kind === 'all' ||
        (kind === 'builtIn') === (role.type === RoleType.DEFAULT)) &&
      role.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openRole = (role: ProjectRole) =>
    navigate(`/platform/users/roles/${role.id}`);

  const menuItems = (role: ProjectRole): RowMenuItem[] => {
    const isBuiltIn = role.type === RoleType.DEFAULT;
    const lockedReason = t('Custom roles are not in your plan');
    return [
      {
        label: isBuiltIn ? t('View') : t('Edit'),
        icon: isBuiltIn ? Eye : Pencil,
        onSelect: () => openRole(role),
      },
      {
        label: t('Duplicate'),
        icon: Copy,
        disabled: !canCustomize,
        disabledReason: lockedReason,
        onSelect: () => setCreating({ startFromId: role.id }),
      },
      {
        label: t('Delete'),
        icon: Trash2,
        destructive: true,
        hidden: isBuiltIn,
        disabled: !canCustomize,
        disabledReason: lockedReason,
        onSelect: () => setDeleting(role),
      },
    ];
  };

  const columns: ColumnDef<RowDataWithActions<ProjectRole>>[] = [
    {
      id: 'name',
      size: 280,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Role')} />
      ),
      cell: ({ row }) => (
        <NameCell
          media={
            <RoleAvatar
              name={row.original.name}
              tone={roleCopy.projectRoleTone(row.original.name)}
              className="size-6 rounded-md text-xs"
            />
          }
          title={row.original.name}
        />
      ),
    },
    {
      id: 'type',
      size: 112,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Type')} />
      ),
      cell: ({ row }) => (
        <MutedCell>
          {row.original.type === RoleType.DEFAULT ? t('Built in') : t('Custom')}
        </MutedCell>
      ),
    },
    {
      id: 'summary',
      size: 420,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('What it allows')} />
      ),
      cell: ({ row }) => (
        <MutedCell>
          {roleCopy.plainSummary({ permissions: row.original.permissions })}
        </MutedCell>
      ),
    },
    {
      id: 'people',
      size: 96,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('People')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => <NumberCell value={row.original.userCount} />,
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

  const filtered = search.trim().length > 0 || kind !== 'all';

  return (
    <Page>
      <AdminPageHeader page="roles">
        <Button
          variant="outline"
          onClick={() => navigate('/platform/users/roles/compare')}
        >
          <Columns3 />
          {t('Compare roles')}
        </Button>
        <LockedRoleButton locked={!canCustomize}>
          <Button disabled={!canCustomize} onClick={() => setCreating({})}>
            <Plus />
            {t('New role')}
          </Button>
        </LockedRoleButton>
      </AdminPageHeader>
      <ListToolbar
        search={<ListSearch placeholder={t('Search roles')} />}
        tabs={
          <CountTabs
            value={kind}
            onValueChange={setKind}
            options={[
              { value: 'all', label: t('All'), count: counts.all },
              { value: 'builtIn', label: t('Built in'), count: counts.builtIn },
              { value: 'custom', label: t('Custom'), count: counts.custom },
            ]}
          />
        }
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No roles match') : t('No project roles yet')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different name or tab.')
            : t('Create a role to decide what members may do in a project.')
        }
        emptyStateIcon={<Shield />}
        columns={columns}
        page={{ data: rows, next: null, previous: null }}
        hidePagination
        onRowClick={(role) => openRole(role)}
        isLoading={isSample ? false : isLoading}
        isError={isSample ? false : isError}
        errorStateEntity={t('roles')}
        onRetry={refetch}
      />
      <PageSection
        title={t('Platform roles')}
        description={t(
          'One per person. Decides console access and which projects they see. Change it for someone on Users.',
        )}
      >
        <PlatformRolesList />
      </PageSection>
      <NewRoleDialog
        open={creating !== null}
        onOpenChange={(open) => !open && setCreating(null)}
        roles={allRoles}
        startFromId={creating?.startFromId}
        onCreated={(role) => {
          refetch();
          openRole(role);
        }}
      />
      <DeleteRoleDialog
        role={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => refetch()}
      />
    </Page>
  );
};

const ROLE_KINDS = ['all', 'builtIn', 'custom'] as const;

type RoleKind = (typeof ROLE_KINDS)[number];

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
