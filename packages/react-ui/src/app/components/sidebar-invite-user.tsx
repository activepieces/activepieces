import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar-shadcn';
import { useEmbedding } from '@/components/embed-provider';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';

export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <InviteUserDialog
      triggerButton={
        <SidebarMenuItem className="hover:bg-accent hover:text-primary rounded-lg transition-colors cursor-pointer">
          <SidebarMenuButton asChild>
            <div className="flex items-center gap-2">
              <Plus className="!size-5" />
              <span>{t('Invite User')}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      }
    />
  );
}