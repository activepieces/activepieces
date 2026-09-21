import { ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils';
import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Shield } from 'lucide-react';
import { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
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
import { ProjectRoleUsersSheet } from './project-role-users-table';
import { RoleAvatar } from './role-avatar';
import { roleCopy } from './role-copy';

export function ProjectRolesList({
  projectRoles,
  isLoading,
  isError,
  refetch,
}: ProjectRolesListProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const [openedRole, setOpenedRole] = useState<ProjectRole | null>(null);
  const [peopleRole, setPeopleRole] = useState<ProjectRole | null>(null);

  if (isLoading) {
    return <SkeletonList numberOfItems={3} className="w-full h-[60px]" />;
  }

  if (isError) {
    return <DataFetchErrorState entity={t('roles')} onRetry={refetch} />;
  }

  const roles = projectRoles?.data ?? [];

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
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => setOpenedRole(role)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setOpenedRole(role);
                }
              }}
            >
              <RoleAvatar name={role.name} />
              <ItemContent>
                <ItemTitle>
                  {role.name}
                  <Badge
                    variant={
                      role.type === RoleType.DEFAULT ? 'accent' : 'inverted'
                    }
                    className="text-xss uppercase tracking-wider"
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
                        setPeopleRole(role);
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
      {openedRole && (
        <ProjectRoleDialog
          key={openedRole.id}
          mode="edit"
          projectRole={openedRole}
          platformId={platform.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setOpenedRole(null);
            }
          }}
          onSave={() => {
            setOpenedRole(null);
            refetch();
          }}
          disabled={openedRole.type === RoleType.DEFAULT}
        />
      )}
      <ProjectRoleUsersSheet
        projectRole={peopleRole}
        isOpen={peopleRole !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPeopleRole(null);
          }
        }}
      />
    </div>
  );
}

type ProjectRolesListProps = {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};
