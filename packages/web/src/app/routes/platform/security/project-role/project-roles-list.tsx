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
          const description = roleCopy.projectRoleSummary({
            name: role.name,
            permissions: role.permissions,
          });
          return (
            <Item
              key={role.id}
              variant="outline"
              size="sm"
              className="relative flex-nowrap bg-background dark:bg-muted/50 hover:bg-accent/50"
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
                      role.type === RoleType.DEFAULT ? 'accent' : 'inverted'
                    }
                    className="shrink-0 text-xss uppercase tracking-wider"
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
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {t('rolePeopleCount', { count: 0 })}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="relative z-10 shrink-0 text-sm tabular-nums text-primary underline-offset-4 hover:underline"
                    onClick={() => setOpened({ role, tab: 'people' })}
                  >
                    {t('rolePeopleCount', { count: role.userCount })}
                  </button>
                ))}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Item>
          );
        })}
      </ItemGroup>
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
