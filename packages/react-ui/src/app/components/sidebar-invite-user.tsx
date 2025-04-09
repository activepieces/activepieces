import { UserPlus } from 'lucide-react'

import { useEmbedding } from '@/components/embed-provider'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog'

export function SidebarInviteUserButton() {
  const { embedState } = useEmbedding()

  if (embedState.isEmbedded) {
    return null
  }

  return (
    <InviteUserDialog
      showTooltip={true}
      triggerButton={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="transparent" size="icon">
              <UserPlus className="size-4  stroke-[2px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Invite User</TooltipContent>
        </Tooltip>
      }
    />
  )
}
