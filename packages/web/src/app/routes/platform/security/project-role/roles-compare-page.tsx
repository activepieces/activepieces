import { ProjectRole, RoleType } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Shield } from 'lucide-react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader } from '@/components/custom/page';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { roleCopy } from '@/features/members/lib/role-copy';
import {
  PermissionGroup,
  PermissionRow,
  rolePermissionModel,
} from '@/features/members/lib/role-permissions';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

export function RolesComparePage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);
  return (
    <Page>
      <PageHeader
        back={{ label: t('Roles'), to: '/platform/users/roles' }}
        title={t('Compare roles')}
        description={t(
          'Every project role side by side. Open a role to change it.',
        )}
      />
      <RolesMatrix
        roles={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
    </Page>
  );
}

function RolesMatrix({
  roles: unsorted,
  isLoading,
  isError,
  refetch,
}: {
  roles: ProjectRole[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  const navigate = useNavigate();
  if (isLoading) {
    return <SkeletonList numberOfItems={6} className="h-12 w-full" />;
  }
  if (isError) {
    return <DataFetchErrorState entity={t('roles')} onRetry={refetch} />;
  }
  const roles = roleCopy.sortProjectRoles({ roles: unsorted });
  if (roles.length === 0) {
    return (
      <Empty className="rounded-2xl bg-panel shadow-edge">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Shield />
          </EmptyMedia>
          <EmptyTitle>{t('No project roles yet')}</EmptyTitle>
          <EmptyDescription>
            {t('Create a role to decide what members may do in a project.')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  const columns = `minmax(16rem, 1.4fr) repeat(${roles.length}, minmax(9rem, 1fr))`;
  return (
    <div className="overflow-x-auto rounded-2xl bg-panel shadow-edge">
      <div
        role="table"
        aria-label={t('Project role permissions')}
        className="grid text-sm"
        style={{
          gridTemplateColumns: columns,
          minWidth: `${16 + roles.length * 9}rem`,
        }}
      >
        <div
          role="columnheader"
          className="flex items-center px-4 py-3 font-medium text-gray-11"
        >
          {t('Permission')}
        </div>
        {roles.map((role) => (
          <RoleHeader
            key={role.id}
            role={role}
            onOpen={() => navigate(`/platform/users/roles/${role.id}`)}
          />
        ))}
        {rolePermissionModel.groups().map((group) => (
          <MatrixGroup key={group.key} group={group} roles={roles} />
        ))}
      </div>
    </div>
  );
}

function RoleHeader({
  role,
  onOpen,
}: {
  role: ProjectRole;
  onOpen: () => void;
}) {
  const isBuiltIn = role.type === RoleType.DEFAULT;
  return (
    <div role="columnheader" className="flex min-w-0 flex-col gap-1 px-4 py-3">
      <button
        type="button"
        className="max-w-full min-w-0 text-left font-semibold text-gray-12 hover:underline"
        onClick={onOpen}
      >
        <TextWithTooltip tooltipMessage={role.name}>
          <span className="block truncate">{role.name}</span>
        </TextWithTooltip>
      </button>
      <span className="text-xs text-gray-11">
        {isBuiltIn ? t('Built in') : t('Custom')}
        {!isNil(role.userCount) &&
          ` · ${t('rolePeopleCount', { count: role.userCount })}`}
      </span>
    </div>
  );
}

function MatrixGroup({
  group,
  roles,
}: {
  group: PermissionGroup;
  roles: ProjectRole[];
}) {
  return (
    <>
      <div
        role="row"
        className="border-t border-gray-6 bg-gray-2 px-4 py-2 text-xs font-medium text-gray-11"
        style={{ gridColumn: '1 / -1' }}
      >
        {group.label}
      </div>
      {group.rows.map((row) => (
        <Fragment key={row.key}>
          <div
            role="rowheader"
            className="flex flex-col justify-center gap-0.5 border-t border-gray-6 px-4 py-2.5"
          >
            <span className="text-gray-12">{row.label}</span>
            <span className="text-xs text-gray-11">{row.hint}</span>
          </div>
          {roles.map((role) => (
            <div
              key={role.id}
              role="cell"
              className="flex items-center border-t border-gray-6 px-4 py-2.5"
            >
              <GrantCell row={row} permissions={role.permissions} />
            </div>
          ))}
        </Fragment>
      ))}
    </>
  );
}

function GrantCell({
  row,
  permissions,
}: {
  row: PermissionRow;
  permissions: string[];
}) {
  const grant = rolePermissionModel.grantOf({ row, permissions });
  if (grant === 'none') {
    return <span className="text-gray-11">{t('None')}</span>;
  }
  if (!row.view) {
    return <Badge variant="outline">{t('Yes')}</Badge>;
  }
  return (
    <Badge variant={grant === 'edit' ? 'secondary' : 'outline'}>
      {grant === 'edit' ? t('Edit') : t('View')}
    </Badge>
  );
}
