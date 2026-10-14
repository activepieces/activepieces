import { ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';

import { AdminEmpty, SettingsPanel, SettingsRow } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/skeleton';
import { roleCopy } from '@/features/members/lib/role-copy';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { ProjectRoleDialog } from './project-role-dialog';
import { RoleAvatar } from './role-avatar';

export function ProjectRolesList({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: ProjectRolesListProps) {
  const [opened, setOpened] = useState<OpenedRole | null>(null);

  if (isLoading) {
    return <SkeletonList numberOfItems={3} className="w-full h-[60px]" />;
  }

  if (isError) {
    return <DataFetchErrorState entity={t('roles')} onRetry={refetch} />;
  }

  const roles = roleCopy.sortProjectRoles({
    roles: projectRoles?.data ?? [],
  });

  if (roles.length === 0) {
    return (
      <AdminEmpty
        icon={<Shield />}
        title={t('No project roles yet. Create one to get started.')}
      />
    );
  }

  return (
    <>
      <SettingsPanel flush>
        {roles.map((role) => {
          const description = roleCopy.projectRoleSummary({
            name: role.name,
            permissions: role.permissions,
          });
          return (
            <SettingsRow
              key={role.id}
              className="relative cursor-pointer first:rounded-t-xl last:rounded-b-xl hover:bg-gray-3 has-focus-visible:bg-gray-3"
              media={
                <RoleAvatar
                  name={role.name}
                  tone={roleCopy.projectRoleTone(role.name)}
                  className="rounded-lg"
                />
              }
              title={
                <>
                  <button
                    type="button"
                    className="min-w-0 text-left focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                    onClick={() => setOpened({ role, tab: 'permissions' })}
                    {...adminControl(AdminControl.ROLES_ROLE_OPEN)}
                  >
                    <TextWithTooltip tooltipMessage={role.name}>
                      <span className="block truncate">{role.name}</span>
                    </TextWithTooltip>
                  </button>
                  <Badge
                    variant={
                      role.type === RoleType.DEFAULT ? 'secondary' : 'info'
                    }
                  >
                    {role.type === RoleType.DEFAULT
                      ? t('Built in')
                      : t('Custom')}
                  </Badge>
                </>
              }
              description={description}
            >
              {!isNil(role.userCount) &&
                (role.userCount === 0 ? (
                  <span className="text-sm tabular-nums text-gray-11">
                    {t('rolePeopleCount', { count: 0 })}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="relative z-10 text-sm tabular-nums text-accent-11 underline-offset-4 hover:underline"
                    onClick={() => setOpened({ role, tab: 'people' })}
                    {...adminControl(AdminControl.ROLES_PEOPLE_OPEN)}
                  >
                    {t('rolePeopleCount', { count: role.userCount })}
                  </button>
                ))}
              <ChevronRight className="size-4 text-gray-11" />
            </SettingsRow>
          );
        })}
      </SettingsPanel>
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

type OpenedRole = {
  role: ProjectRole;
  tab: 'permissions' | 'people';
};

type ProjectRolesListProps = {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};
