import { Permission } from '@activepieces/core-utils';
import { AgentSummary } from '@activepieces/shared';
import { t } from 'i18next';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteAgentDialog } from '@/features/agents/delete-agent-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';

export const AgentActionsMenu = ({ agent }: AgentActionsMenuProps) => {
  const [deleting, setDeleting] = useState(false);
  const { checkAccess } = useAuthorization(agent.projectId);

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
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleting(true)}
          >
            <Trash2 />
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAgentDialog
        agent={agent}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </>
  );
};

type AgentActionsMenuProps = {
  agent: AgentSummary;
};
