import { UserPlus } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';

export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded) {
    return null;
  }

  return (
    <InviteUserDialog
      showTooltip={true}
      triggerButton={
        <Tooltip>
          <TooltipTrigger asChild>
            <UserPlus className="size-4 text-muted-foreground hover:text-primary" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Invite User</TooltipContent>
        </Tooltip>
      }
    />
  );
}
