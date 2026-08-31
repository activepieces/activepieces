import { Permission } from '@activepieces/core-utils';
import { AgentSummary } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
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
import { agentsApi } from '@/features/agents/api/agents';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';

export const AgentActionsMenu = ({ agent }: AgentActionsMenuProps) => {
  const queryClient = useQueryClient();
  const { checkAccess } = useAuthorization(agent.projectId);

  if (!checkAccess(Permission.WRITE_AGENT)) {
    return null;
  }

  return (
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
        <ConfirmationDeleteDialog
          title={t('Delete {name}', { name: agent.displayName })}
          message={t(
            'Its instructions, its tools, and every conversation held with it are deleted for good. Any draft flow step using it will break.',
          )}
          entityName={agent.displayName}
          buttonText={t('Delete')}
          mutationFn={async () => {
            await agentsApi.delete(agent.id);
            await queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast.success(t('Deleted {name}', { name: agent.displayName }));
          }}
          onError={(error) =>
            toast.error(
              api.extractServerErrorMessage(
                error,
                t('That agent could not be deleted.'),
              ),
            )
          }
        >
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => event.preventDefault()}
          >
            <Trash2 />
            {t('Delete')}
          </DropdownMenuItem>
        </ConfirmationDeleteDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type AgentActionsMenuProps = {
  agent: AgentSummary;
};
