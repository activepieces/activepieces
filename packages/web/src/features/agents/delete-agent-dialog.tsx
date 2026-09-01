import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { agentsApi } from '@/features/agents/api/agents';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { api } from '@/lib/api';

export const DeleteAgentDialog = ({
  agent,
  open,
  onOpenChange,
  onDeleted,
  children,
}: DeleteAgentDialogProps) => {
  const queryClient = useQueryClient();
  const { data: withUsage } = agentsQueries.useAgent({
    id: agent.id,
    includeUsage: true,
    enabled: open,
  });
  const usage = withUsage?.publishedFlowsUsingAgent;
  const stillInUse = (usage?.total ?? 0) > 0;

  return (
    <ConfirmationDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Delete {name}', { name: agent.displayName })}
      message={t(
        'Its instructions, its tools, and every conversation held with it are deleted for good. Any draft flow step using it will break.',
      )}
      warning={stillInUse ? describeUsage(usage) : undefined}
      confirmDisabled={stillInUse}
      entityName={agent.displayName}
      buttonText={t('Delete')}
      mutationFn={async () => {
        await agentsApi.delete(agent.id);
        queryClient.removeQueries({ queryKey: ['agents', 'one', agent.id] });
        void queryClient.invalidateQueries({ queryKey: ['agents'] });
        toast.success(t('Deleted {name}', { name: agent.displayName }));
        onDeleted?.();
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
      {children}
    </ConfirmationDeleteDialog>
  );
};

function describeUsage(usage?: { total: number; names: string[] }): string {
  if (usage === undefined) {
    return '';
  }
  if (usage.names.length === 0) {
    return t('agentStillUsedUnnamed', { count: usage.total });
  }
  if (usage.total > usage.names.length) {
    return t('agentStillUsedPartlyNamed', {
      count: usage.total,
      flows: usage.names.join(', '),
    });
  }
  return t('agentStillUsedNamed', {
    count: usage.total,
    flows: usage.names.join(', '),
  });
}

type DeleteAgentDialogProps = {
  agent: { id: string; displayName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  children?: React.ReactNode;
};
