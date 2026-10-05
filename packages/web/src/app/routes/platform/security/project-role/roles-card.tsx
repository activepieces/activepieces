import { ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Shield } from 'lucide-react';
import { Fragment, useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { PageSection } from '@/components/custom/page';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { PlusIcon } from '@/components/icons/plus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { roleCopy } from '@/features/members/lib/role-copy';
import {
  PermissionGroup,
  PermissionRow,
  rolePermissionModel,
} from '@/features/members/lib/role-permissions';
import { platformHooks } from '@/hooks/platform-hooks';

import { PlatformRolesList } from './platform-roles-list';
import { ProjectRoleDialog } from './project-role-dialog';

export function NewRoleButton({ refetch }: { refetch: () => void }) {
  const { platform } = platformHooks.useCurrentPlatform();

  if (!platform.plan.customRolesEnabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <AnimatedIconButton icon={PlusIcon} iconSize={20} disabled>
              {t('New role')}
            </AnimatedIconButton>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('Contact sales to unlock custom roles')}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ProjectRoleDialog mode="create" onSave={() => refetch()}>
      <AnimatedIconButton icon={PlusIcon} iconSize={20}>
        {t('New role')}
      </AnimatedIconButton>
    </ProjectRoleDialog>
  );
}

export function RolesCard({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: RolesCardProps) {
  return (
    <>
      <RolesMatrix
        projectRoles={projectRoles}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
      />
      <PageSection
        title={t('Platform roles')}
        description={t(
          'One per person. Decides console access and which projects they see. Change it for someone on Users.',
        )}
      >
        <PlatformRolesList />
      </PageSection>
    </>
  );
}

function RolesMatrix({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: RolesCardProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const [opened, setOpened] = useState<OpenedRole | null>(null);

  if (isLoading) {
    return <SkeletonList numberOfItems={6} className="h-12 w-full" />;
  }

  if (isError) {
    return <DataFetchErrorState entity={t('roles')} onRetry={refetch} />;
  }

  const roles = roleCopy.sortProjectRoles({
    roles: projectRoles?.data ?? [],
  });

  if (roles.length === 0) {
    return (
      <div className="rounded-2xl bg-panel shadow-edge">
        <Empty>
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
      </div>
    );
  }

  const groups = rolePermissionModel.groups();
  const columns = `minmax(16rem, 1.4fr) repeat(${roles.length}, minmax(9rem, 1fr))`;

  return (
    <>
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
            className="flex items-center px-5 py-3 font-medium text-gray-11"
          >
            {t('Permission')}
          </div>
          {roles.map((role) => (
            <RoleHeader
              key={role.id}
              role={role}
              canEdit={
                role.type !== RoleType.DEFAULT &&
                platform.plan.customRolesEnabled
              }
              onOpen={(tab) => setOpened({ role, tab })}
            />
          ))}
          {groups.map((group) => (
            <MatrixGroup key={group.key} group={group} roles={roles} />
          ))}
        </div>
      </div>
      {opened && (
        <ProjectRoleDialog
          key={`${opened.role.id}-${opened.tab}`}
          mode="edit"
          projectRole={opened.role}
          initialTab={opened.tab}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setOpened(null);
            }
          }}
          onSave={() => {
            setOpened(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

function RoleHeader({
  role,
  canEdit,
  onOpen,
}: {
  role: ProjectRole;
  canEdit: boolean;
  onOpen: (tab: 'permissions' | 'people') => void;
}) {
  const isBuiltIn = role.type === RoleType.DEFAULT;
  return (
    <div role="columnheader" className="flex min-w-0 flex-col gap-1 px-5 py-3">
      <button
        type="button"
        className="max-w-full min-w-0 text-left font-semibold text-gray-12 hover:underline"
        onClick={() => onOpen('permissions')}
      >
        <TextWithTooltip tooltipMessage={role.name}>
          <span className="block truncate">{role.name}</span>
        </TextWithTooltip>
      </button>
      <div className="flex h-6 items-center gap-2">
        <Badge variant={isBuiltIn ? 'outline' : 'secondary'}>
          {isBuiltIn ? t('Built in') : t('Custom')}
        </Badge>
        {!isNil(role.userCount) && (
          <button
            type="button"
            disabled={role.userCount === 0}
            className="text-xs whitespace-nowrap text-accent-11 tabular-nums hover:underline disabled:pointer-events-none disabled:text-gray-11"
            onClick={() => onOpen('people')}
          >
            {t('rolePeopleCount', { count: role.userCount })}
          </button>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('Edit {name}', { name: role.name })}
            onClick={() => onOpen('permissions')}
          >
            <Pencil />
          </Button>
        )}
      </div>
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
        className="border-t border-gray-6 bg-gray-2 px-5 py-2 text-xs font-medium text-gray-11"
        style={{ gridColumn: '1 / -1' }}
      >
        {group.label}
      </div>
      {group.rows.map((row) => (
        <Fragment key={row.key}>
          <div
            role="rowheader"
            className="flex flex-col justify-center gap-0.5 border-t border-gray-6 px-5 py-2.5"
          >
            <span className="text-gray-12">{row.label}</span>
            {ROW_HINTS[row.key] && (
              <span className="text-xs text-gray-11">
                {t(ROW_HINTS[row.key])}
              </span>
            )}
          </div>
          {roles.map((role) => (
            <div
              key={role.id}
              role="cell"
              className="flex items-center border-t border-gray-6 px-5 py-2.5"
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
  const grant = grantOf({ row, permissions });
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

function grantOf({
  row,
  permissions,
}: {
  row: PermissionRow;
  permissions: string[];
}): Grant {
  if (row.edit && permissions.includes(row.edit)) {
    return 'edit';
  }
  if (row.view && permissions.includes(row.view)) {
    return 'view';
  }
  return 'none';
}

const ROW_HINTS: Record<string, string> = {
  flows: 'Open flows; edit means build and change them.',
  'flow-status': 'Turn a flow on or off and publish drafts.',
  folders: 'Organise flows into folders.',
  tables: 'Read rows; edit means change columns and data.',
  agents: 'Open agents; edit means change prompts and tools.',
  'knowledge-base': 'Documents agents may cite.',
  variables: 'Project variables and secrets.',
  'mcp-servers': 'Connect AI clients to the project.',
  runs: 'See run history; edit means retry.',
  alerts: 'Who is emailed when a flow fails.',
  'app-connections': 'Use connections; edit means create and rotate them.',
  'project-releases': 'Git sync and release history.',
  'project-members': 'See who is in the project; edit means add and remove.',
  invitations: 'Invite people to the project.',
  'project-settings': 'Name, limits and environment.',
};

type Grant = 'none' | 'view' | 'edit';

type OpenedRole = {
  role: ProjectRole;
  tab: 'permissions' | 'people';
};

type RolesCardProps = {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};
