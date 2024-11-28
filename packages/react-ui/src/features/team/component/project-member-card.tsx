import { AvatarFallback } from '@radix-ui/react-avatar';
import { t } from 'i18next';
import { Trash } from 'lucide-react';

import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';

import { ConfirmationDeleteDialog } from '../../../components/delete-dialog';
import { Avatar } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { projectMembersApi } from '../lib/project-members-api';
import { projectMembersHooks } from '../lib/project-members-hooks';

import { EditRoleDialog } from './edit-role-dialog';

type ProjectMemberCardProps = {
  member: ProjectMemberWithUser;
  onUpdate: () => void;
};

export function ProjectMemberCard({
  member,
  onUpdate,
}: ProjectMemberCardProps) {
  const { refetch } = projectMembersHooks.useProjectMembers();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRemoveMember = checkAccess(
    Permission.WRITE_PROJECT_MEMBER,
  );
  const { project } = projectHooks.useCurrentProject();
  const deleteMember = async () => {
    await projectMembersApi.delete(member.id);
    refetch();
    onUpdate();
  };

  return (
    <div
      className="w-full flex items-center justify-between space-x-4"
      key={member.id}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="hidden size-9 sm:flex">
          <AvatarFallback className="justify-center items-center flex">
            <span className="p-2">
              {member.user.firstName.charAt(0).toLocaleUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium leading-none">
            {member.user.firstName} {member.user.lastName} (
            {member.projectRole.name})
          </p>
          <p className="text-sm text-muted-foreground">{member.user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {project.ownerId !== member.userId && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToRemoveMember}
          >
            <EditRoleDialog
              member={member}
              onSave={() => {
                refetch();
              }}
              disabled={!userHasPermissionToRemoveMember}
            />
            <ConfirmationDeleteDialog
              title={`${t('Remove')} ${member.user.firstName} ${
                member.user.lastName
              }`}
              message={t('Are you sure you want to remove this member?')}
              mutationFn={() => deleteMember()}
              entityName={`${member.user.firstName} ${member.user.lastName}`}
            >
              <Button
                disabled={!userHasPermissionToRemoveMember}
                variant="ghost"
                className="size-8 p-0"
              >
                <Trash className="text-destructive size-4" />
              </Button>
            </ConfirmationDeleteDialog>
          </PermissionNeededTooltip>
        )}
      </div>
    </div>
  );
}
