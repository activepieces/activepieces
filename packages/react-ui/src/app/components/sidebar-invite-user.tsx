import { t } from 'i18next';
import { ChevronRight, UserPlus } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';

export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <Tooltip>
      <InviteUserDialog>
        <TooltipTrigger asChild>
          <SidebarMenuButton className="w-full justify-start hover:bg-accent hover:text-primary rounded-lg transition-colors">
            <UserPlus className="size-4  stroke-[2px]" />
            <span>Invite User</span>
          </SidebarMenuButton>
        </TooltipTrigger>
      </InviteUserDialog>
      <TooltipContent side="bottom">{t('Invite User')}</TooltipContent>
    </Tooltip>
  );
}
