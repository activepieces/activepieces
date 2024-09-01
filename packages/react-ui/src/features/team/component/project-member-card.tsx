import { AvatarFallback } from '@radix-ui/react-avatar';
import { t } from 'i18next';
import { Trash } from 'lucide-react';

import { useAuthorization } from '@/components/authorization';
import { PermissionNeededWrapper } from '@/components/ui/permission-needed-wrapper';
import { projectHooks } from '@/hooks/project-hooks';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';

import { ConfirmationDeleteDialog } from '../../../components/delete-dialog';
import { Avatar, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { projectMembersApi } from '../lib/project-members-api';
import { projectMembersHooks } from '../lib/project-members-hooks';

export function ProjectMemberCard({
  member,
}: {
  member: ProjectMemberWithUser;
}) {
  const { refetch } = projectMembersHooks.useProjectMembers();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRemoveMember = checkAccess(
    Permission.WRITE_PROJECT_MEMBER,
  );
  const { project } = projectHooks.useCurrentProject();
  const deleteMember = async () => {
    await projectMembersApi.delete(member.id);
    refetch();
  };

  return (
    <div
      className="flex items-center justify-between space-x-4"
      key={member.id}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="hidden size-9 sm:flex">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback className="justify-center items-center flex">
            <span className="p-2">
              {member.user.email.charAt(0).toLocaleUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">
            {member.user.firstName} {member.user.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{member.user.email}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {project.ownerId !== member.userId && (
          <PermissionNeededWrapper
            hasPermission={userHasPermissionToRemoveMember}
          >
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
          </PermissionNeededWrapper>
        )}
      </div>
    </div>
  );
}
