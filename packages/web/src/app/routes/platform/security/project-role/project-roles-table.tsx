import { ProjectRole, RoleType, SeekPage } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, PenLine, Pencil, Shield, ShieldCheck, Trash, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { projectRoleApi } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRoleUsersSheet } from './project-role-users-table';

interface ProjectRolesListProps {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  refetch: () => void;
}

function getRoleIcon(roleName: string) {
  switch (roleName) {
    case 'Admin':
      return <ShieldCheck />;
    case 'Editor':
      return <PenLine />;
    case 'Viewer':
      return <Eye />;
    default:
      return <Shield />;
  }
}

export const ProjectRolesTable = ({
  projectRoles,
  isLoading,
  refetch,
}: ProjectRolesListProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedRole, setSelectedRole] = useState<ProjectRole | null>(null);
  const [isUsersSheetOpen, setIsUsersSheetOpen] = useState(false);

  const { mutate: deleteProjectRole } = useMutation({
    mutationKey: ['delete-project-role'],
    mutationFn: (name: string) => projectRoleApi.delete(name),
    onSuccess: () => {
      refetch();
      toast.success(t('Project Role entry deleted successfully'), {
        duration: 3000,
      });
    },
  });

  if (isLoading) {
    return <SkeletonList numberOfItems={3} className="w-full h-[60px]" />;
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
  <>
    <ItemGroup className="gap-2">
      {roles.map((role) => (
        <Item key={role.id} variant="outline" size="sm">
          <ItemMedia variant="icon">
            {getRoleIcon(role.name)}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{role.name}</ItemTitle>
            <ItemDescription>
              <Badge
                variant={role.type === RoleType.DEFAULT ? 'accent' : 'secondary'}
              >
                {role.type === RoleType.DEFAULT ? t('Default') : t('Custom')}
              </Badge>
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-2 h-8 text-muted-foreground"
              onClick={() => {
                setSelectedRole(role);
                setIsUsersSheetOpen(true);
              }}
            >
              <Users className="size-4" />
              <span className="text-xs">
                {role.userCount === 1
                  ? t('1 user')
                  : t(`${role.userCount} users`)}
              </span>
            </Button>
            <ProjectRoleDialog
              mode="edit"
              projectRole={role}
              platformId={platform.id}
              onSave={() => refetch()}
              disabled={role.type === RoleType.DEFAULT}
            >
              <Button variant="ghost" size="sm" className="size-8 p-0">
                {role.type === RoleType.DEFAULT ? (
                  <Eye className="size-4" />
                ) : (
                  <Pencil className="size-4" />
                )}
              </Button>
            </ProjectRoleDialog>
            {role.type !== RoleType.DEFAULT && (
              <ConfirmationDeleteDialog
                isDanger={true}
                title={t('Delete Role')}
                message={t(
                  `Deleting this role will remove ${role.userCount} project member${
                    role.userCount === 1 ? '' : 's'
                  } and all associated invitations. Are you sure you want to proceed?`,
                )}
                entityName={`${t('Project Role')} ${role.name}`}
                mutationFn={async () => deleteProjectRole(role.name)}
              >
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <Trash className="size-4 text-destructive" />
                </Button>
              </ConfirmationDeleteDialog>
            )}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
    <ProjectRoleUsersSheet
      projectRole={selectedRole}
      isOpen={isUsersSheetOpen}
      onOpenChange={setIsUsersSheetOpen}
    />
  </>
  );
};
