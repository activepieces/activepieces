import { t } from 'i18next';
import { UserPlus } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
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
    <Tooltip>
      <InviteUserDialog>
        <TooltipTrigger asChild>
          <Button variant="transparent" size="icon">
            <UserPlus className="size-4  stroke-[2px]" />
          </Button>
        </TooltipTrigger>
      </InviteUserDialog>
      <TooltipContent side="bottom">{t('Invite User')}</TooltipContent>
    </Tooltip>
  );
}
