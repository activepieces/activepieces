import { ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Panel, SettingRows } from '@/components/custom/panel';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { roleCopy } from '@/features/members/lib/role-copy';

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
    return <SkeletonList numberOfItems={3} className="h-16 w-full" />;
  }

  if (isError) {
    return <DataFetchErrorState entity={t('roles')} onRetry={refetch} />;
  }

  const roles = roleCopy.sortProjectRoles({
    roles: projectRoles?.data ?? [],
  });

  if (roles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Shield />
          </EmptyMedia>
          <EmptyDescription>
            {t('No project roles yet. Create one to get started.')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Panel flush>
        <SettingRows>
          {roles.map((role) => {
            const description = roleCopy.projectRoleSummary({
              name: role.name,
              permissions: role.permissions,
            });
            return (
              <Item
                key={role.id}
                className="relative cursor-pointer flex-nowrap items-center hover:bg-gray-3 focus-within:bg-gray-3"
              >
                <RoleAvatar
                  name={role.name}
                  tone={roleCopy.projectRoleTone(role.name)}
                />
                <ItemContent className="min-w-0">
                  <ItemTitle className="min-w-0 max-w-full">
                    <button
                      type="button"
                      className="min-w-0 text-left after:absolute after:inset-0 after:content-['']"
                      onClick={() => setOpened({ role, tab: 'permissions' })}
                    >
                      <TextWithTooltip tooltipMessage={role.name}>
                        <span className="block truncate">{role.name}</span>
                      </TextWithTooltip>
                    </button>
                    <Badge
                      variant={
                        role.type === RoleType.DEFAULT ? 'secondary' : 'info'
                      }
                      className="shrink-0"
                    >
                      {role.type === RoleType.DEFAULT
                        ? t('Built in')
                        : t('Custom')}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription>{description}</ItemDescription>
                </ItemContent>
                {!isNil(role.userCount) &&
                  (role.userCount === 0 ? (
                    <span className="shrink-0 text-sm tabular-nums text-gray-11">
                      {t('rolePeopleCount', { count: 0 })}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="relative z-10 shrink-0 text-sm tabular-nums text-accent-11 underline-offset-4 hover:underline"
                      onClick={() => setOpened({ role, tab: 'people' })}
                    >
                      {t('rolePeopleCount', { count: role.userCount })}
                    </button>
                  ))}
                <ChevronRight className="size-5 shrink-0 text-gray-11" />
              </Item>
            );
          })}
        </SettingRows>
      </Panel>
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
