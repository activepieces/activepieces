import { Permission } from '@activepieces/core-utils';
import { AgentSummary } from '@activepieces/shared';
import { t } from 'i18next';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { agentsMutations } from '@/features/agents/hooks/agents-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type AgentActionsMenuProps = {
  agent: AgentSummary;
};

export const AgentActionsMenu = ({ agent }: AgentActionsMenuProps) => {
  const { checkAccess } = useAuthorization();
  const deleteAgent = agentsMutations.useDeleteAgent({
    onError: (error) =>
      toast.error(
        api.extractServerErrorMessage(
          error,
          t('That agent could not be deleted.'),
        ),
      ),
  });

  const inActiveProject =
    agent.projectId === authenticationSession.getProjectId();
  if (inActiveProject && !checkAccess(Permission.WRITE_AGENT)) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('Agent actions')}
          onClick={(event) => event.stopPropagation()}
          className="size-7 rounded-full bg-background/80 backdrop-blur-sm"
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <ConfirmationDeleteDialog
          title={t('Delete {name}', { name: agent.displayName })}
          message={t(
            'Every conversation anyone had with this agent is deleted with it, and any flow step still pointing at it stops working.',
          )}
          entityName={agent.displayName}
          buttonText={t('Delete')}
          mutationFn={async () => {
            await deleteAgent.mutateAsync(agent.id);
            toast.success(t('Deleted {name}', { name: agent.displayName }));
          }}
          onError={() => undefined}
        >
          <DropdownMenuItem
            onSelect={(event) => event.preventDefault()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex cursor-pointer flex-row items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              <span className="text-destructive">{t('Delete')}</span>
            </div>
          </DropdownMenuItem>
        </ConfirmationDeleteDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
