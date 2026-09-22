import { ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import { SkeletonList } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';

import { ProjectRoleDialog } from './project-role-dialog';
import { RoleAvatar } from './role-avatar';
import { roleCopy } from './role-copy';

export function ProjectRolesList({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: ProjectRolesListProps) {
  const { platform } = platformHooks.useCurrentPlatform();
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
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Shield className="size-10" />
        <p className="text-sm">
          {t('No project roles yet. Create one to get started.')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup className="gap-2">
        {roles.map((role) => {
          const description = roleCopy.builtInProjectRoleDescription(role.name);
          return (
            <Item
              key={role.id}
              variant="outline"
              size="sm"
              role="button"
              tabIndex={0}
              className="cursor-pointer flex-nowrap hover:bg-accent/50"
              onClick={() => setOpened({ role, tab: 'permissions' })}
              onKeyDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === 'Enter' || event.key === ' ')
                ) {
                  event.preventDefault();
                  setOpened({ role, tab: 'permissions' });
                }
              }}
            >
              <RoleAvatar
                name={role.name}
                tone={roleCopy.projectRoleTone(role.name)}
              />
              <ItemContent className="min-w-0">
                <ItemTitle className="min-w-0 max-w-full">
                  <TextWithTooltip tooltipMessage={role.name}>
                    <span className="truncate">{role.name}</span>
                  </TextWithTooltip>
                  <Badge
                    variant={
                      role.type === RoleType.DEFAULT ? 'accent' : 'inverted'
                    }
                    className="shrink-0 text-xss uppercase tracking-wider"
                  >
                    {role.type === RoleType.DEFAULT
                      ? t('Built in')
                      : t('Custom')}
                  </Badge>
                </ItemTitle>
                <ItemDescription>
                  {description}
                  {description && !isNil(role.userCount) && ' · '}
                  {!isNil(role.userCount) && (
                    <button
                      type="button"
                      className="text-primary hover:underline underline-offset-4"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpened({ role, tab: 'people' });
                      }}
                    >
                      {t('rolePeopleCount', { count: role.userCount })}
                    </button>
                  )}
                </ItemDescription>
              </ItemContent>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Item>
          );
        })}
      </ItemGroup>
      <p className="text-xs text-muted-foreground">
        {t(
          'Press a row to open the role. Press the people count to see who has it. Edit and delete live inside the role, so the list stays quiet.',
        )}
      </p>
      {opened && (
        <ProjectRoleDialog
          key={`${opened.role.id}-${opened.tab}`}
          mode="edit"
          projectRole={opened.role}
          platformId={platform.id}
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
    </div>
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
