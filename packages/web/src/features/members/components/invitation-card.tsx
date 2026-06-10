import { Permission, UserInvitation } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { userInvitationApi } from '../api/user-invitation';
import { userInvitationsHooks } from '../hooks/user-invitations-hooks';

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
        <UserAvatar
          name={invitation.email}
          email={invitation.email}
          size={32}
          disableTooltip={true}
        ></UserAvatar>
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
            message={t('This invitation will be revoked immediately.')}
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
