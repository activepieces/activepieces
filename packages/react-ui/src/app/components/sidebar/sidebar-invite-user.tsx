import { t } from 'i18next';
import { UserPlus } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <InviteUserDialog>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <UserPlus className="size-4  stroke-[2px]" />
          <span>{t('Invite User')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </InviteUserDialog>
  );
}
