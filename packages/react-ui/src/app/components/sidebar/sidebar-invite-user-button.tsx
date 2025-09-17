// Custom
import { UserPlus } from 'lucide-react';

import { useState } from 'react';

import { useEmbedding } from '@/components/embed-provider';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';

export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <div className={`w-full flex items-center gap-2 px-2 py-1.5`}>
      <SidebarMenuButton onClick={() => setInviteOpen(true)}>
        <UserPlus className="size-4" />
        <span>Invite User</span>
      </SidebarMenuButton>
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
    </div>
  );
}
