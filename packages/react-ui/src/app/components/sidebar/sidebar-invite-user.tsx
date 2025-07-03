import { UserPlus } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';

export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <InviteUserDialog>
      <SidebarMenuButton>
        <UserPlus className="size-4  stroke-[2px]" />
        <span>Invite User</span>
      </SidebarMenuButton>
    </InviteUserDialog>
  );
}
