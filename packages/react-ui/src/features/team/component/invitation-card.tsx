import { UserInvitation } from '@activepieces/shared';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { useQueryClient } from '@tanstack/react-query';
import { Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '../../../components/delete-dialog';
import { Avatar, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { userInvitationsHooks } from '../../../hooks/user-invitations-hooks';
import { userInvitiationApi } from '../../../lib/user-invitiation-api';

export function InvitationCard({ invitation }: { invitation: UserInvitation }) {
  const queryClient = useQueryClient();
  return (
    <div
      className="flex items-center justify-between space-x-4"
      key={invitation.id}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="hidden size-9 sm:flex">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback>{invitation.email.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{invitation.email}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <ConfirmationDeleteDialog
          mutationFn={() =>
            userInvitiationApi.delete(invitation.id).then((data) => {
              userInvitationsHooks.invalidate(queryClient);
              return data;
            })
          }
          entityName={invitation.email}
          title={`Remove ${invitation.email}`}
          message="Are you sure you want to remove this invitation?"
        >
          <Button variant="ghost" className="size-8 p-0">
            <Trash className="bg-destructive-500 size-4" />
          </Button>
        </ConfirmationDeleteDialog>
      </div>
    </div>
  );
}
