import { Permission } from '@activepieces/core-utils';
import { AgentSummary } from '@activepieces/shared';
import {
  Delete02Icon,
  FolderTransferIcon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteAgentDialog } from '@/features/agents/delete-agent-dialog';
import { MoveAgentDialog } from '@/features/agents/move-agent-dialog';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';

export const AgentActionsMenu = ({ agent }: AgentActionsMenuProps) => {
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const { checkAccess } = useAuthorization(agent.projectId);
  const { data: allProjects } = projectCollectionUtils.useAll();
  const canMove = (allProjects ?? []).length > 1;

  if (!checkAccess(Permission.WRITE_AGENT)) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('Agent actions')}
            className="pointer-events-none size-7 rounded-full opacity-0 transition-opacity focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canMove && (
            <DropdownMenuItem onSelect={() => setMoving(true)}>
              <HugeiconsIcon icon={FolderTransferIcon} />
              {t('Move to another project')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleting(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAgentDialog
        agent={agent}
        open={deleting}
        onOpenChange={setDeleting}
      />
      <MoveAgentDialog agent={agent} open={moving} onOpenChange={setMoving} />
    </>
  );
};

type AgentActionsMenuProps = {
  agent: AgentSummary;
};
