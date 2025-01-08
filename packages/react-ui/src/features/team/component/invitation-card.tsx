import { AvatarFallback } from '@radix-ui/react-avatar';
import { t } from 'i18next';
import { Trash } from 'lucide-react';

import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission, UserInvitation } from '@activepieces/shared';

import { ConfirmationDeleteDialog } from '../../../components/delete-dialog';
import { Avatar, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { userInvitationApi } from '../lib/user-invitation';
import { userInvitationsHooks } from '../lib/user-invitations-hooks';

export function InvitationCard({ invitation }: { invitation: UserInvitation }) {
  const { refetch } = userInvitationsHooks.useInvitations();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRemoveInvitation = checkAccess(
    Permission.WRITE_INVITATION,
  );
  async function deleteInvitation() {
    await userInvitationApi.delete(invitation.id);
    refetch();
  }
  return (
    <div
      className="flex items-center justify-between space-x-4"
      key={invitation.id}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="hidden size-9 sm:flex">
          <AvatarImage src="/avatars/05.png" alt={t('Avatar')} />
          <AvatarFallback className="justify-center items-center flex">
            <span className="p-2">
              {invitation.email.charAt(0).toLocaleUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">
            {invitation.email} ({invitation.projectRole?.name})
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <PermissionNeededTooltip
          hasPermission={userHasPermissionToRemoveInvitation}
        >
          <ConfirmationDeleteDialog
            mutationFn={() => deleteInvitation()}
            entityName={invitation.email}
            title={t('Remove {email}', { email: invitation.email })}
            message={t('Are you sure you want to remove this invitation?')}
          >
            <Button
              disabled={!userHasPermissionToRemoveInvitation}
              variant="ghost"
              className="size-8 p-0"
            >
              <Trash className="text-destructive size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        </PermissionNeededTooltip>
      </div>
    </div>
  );
}
