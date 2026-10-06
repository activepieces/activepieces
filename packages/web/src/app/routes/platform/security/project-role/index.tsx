import { ProjectRole, RoleType } from '@activepieces/core-utils';
import {
  Add01Icon,
  ColumnInsertIcon,
  Copy01Icon,
  CrownIcon,
  Delete02Icon,
  PencilEdit01Icon,
  Shield01Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { roleCopy } from '@/features/members/lib/role-copy';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { useStableCallback } from '@/hooks/use-stable-callback';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { CustomRolesLock, useCustomRolesLock } from './custom-roles-lock';
import { CustomRolesLockedCallout } from './custom-roles-locked-callout';
import { DeleteRoleDialog } from './delete-role-dialog';
import { NewRoleDialog } from './new-role-dialog';
import { PlatformRolesList } from './platform-roles-list';
import { RoleAvatar } from './role-avatar';
import { rolesPlan } from './sample-roles';

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

  const isSample = rolesPlan.isLocked(platform.plan);
  const customRolesLock = useCustomRolesLock();
  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(!isSample);
  const allRoles = useMemo(
    () =>
      roleCopy.sortProjectRoles({
        roles: isSample ? rolesPlan.sampleRoles() : data?.data ?? [],
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

  const menuItems = useStableCallback((role: ProjectRole): RowMenuItem[] => {
    const isBuiltIn = role.type === RoleType.DEFAULT;
    const viewOnly = isBuiltIn || customRolesLock.locked;
    return [
      {
        label: viewOnly ? t('View') : t('Edit'),
        icon: viewOnly ? ViewIcon : PencilEdit01Icon,
        control: viewOnly
          ? AdminControl.ROLES_ROLE_OPEN
          : AdminControl.ROLES_EDIT_OPEN,
        onSelect: () => openRole(role),
      },
      {
        label: t('Duplicate'),
        icon: Copy01Icon,
        control: AdminControl.ROLES_NEW_OPEN,
        disabled: customRolesLock.locked,
        disabledReason: customRolesLock.reason,
        onSelect: () => setCreating({ startFromId: role.id }),
      },
      {
        label: t('Delete'),
        icon: Delete02Icon,
        destructive: true,
        hidden: isBuiltIn,
        disabled: customRolesLock.locked,
        disabledReason: customRolesLock.reason,
        control: AdminControl.ROLES_DELETE_OPEN,
        onSelect: () => setDeleting(role),
      },
    ];
  });

  const columns = useMemo(
    (): ColumnDef<RowDataWithActions<ProjectRole>>[] => [
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
            {row.original.type === RoleType.DEFAULT
              ? t('Built in')
              : t('Custom')}
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
    ],
    [menuItems],
  );

  const filtered = search.trim().length > 0 || kind !== 'all';

  return (
    <Page>
      <AdminPageHeader page="roles">
        <Button
          variant="outline"
          onClick={() => navigate('/platform/users/roles/compare')}
        >
          <HugeiconsIcon icon={ColumnInsertIcon} />
          {t('Compare roles')}
        </Button>
        <LockedButton lock={customRolesLock}>
          <Button
            {...adminControl(AdminControl.ROLES_NEW_OPEN)}
            disabled={customRolesLock.locked}
            onClick={() => setCreating({})}
          >
            {customRolesLock.locked ? (
              <HugeiconsIcon icon={CrownIcon} />
            ) : (
              <HugeiconsIcon icon={Add01Icon} />
            )}
            {t('New role')}
          </Button>
        </LockedButton>
      </AdminPageHeader>
      {!isSample && customRolesLock.locked && <CustomRolesLockedCallout />}
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
        emptyStateIcon={<HugeiconsIcon icon={Shield01Icon} />}
        columns={columns}
        page={{ data: rows, next: null, previous: null }}
        hidePagination
        onRowClick={(role) => openRole(role)}
        rowControl={AdminControl.ROLES_ROLE_OPEN}
        isLoading={isSample ? false : isLoading}
        isError={isSample ? false : isError}
        errorStateEntity={t('roles')}
        onRetry={refetch}
      />
      <PageSection
        title={t('Platform roles')}
        description={
          <>
            {t(
              'One per person. Decides console access and which projects they see.',
            )}{' '}
            <Link
              to="/platform/users"
              className="font-medium text-gray-12 underline underline-offset-4"
            >
              {t('Change it for someone on Users')}
            </Link>
          </>
        }
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

function LockedButton({
  lock,
  children,
}: {
  lock: CustomRolesLock;
  children: React.ReactElement;
}) {
  if (!lock.locked) {
    return children;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{children}</span>
      </TooltipTrigger>
      <TooltipContent>{lock.reason}</TooltipContent>
    </Tooltip>
  );
}

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
