import { AgentUsage } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
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
      warning={
        stillInUse && usage !== undefined && withUsage !== undefined ? (
          <FlowsUsingAgent usage={usage} projectId={withUsage.projectId} />
        ) : undefined
      }
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

export function FlowsUsingAgent({
  usage,
  projectId,
}: {
  usage: AgentUsage;
  projectId: string;
}) {
  if (usage.flows.length === 0) {
    return <>{describeUsage(usage)}</>;
  }
  const unnamed = usage.total - usage.flows.length;
  return (
    <div className="flex flex-col gap-1">
      <span>{t('agentStillUsedUnnamed', { count: usage.total })}</span>
      <ul className="max-h-40 list-disc overflow-y-auto pl-4">
        {usage.flows.map((flow) => (
          <li key={flow.id}>
            <Link
              to={`/projects/${projectId}/flows/${flow.id}`}
              className="font-medium underline underline-offset-2"
            >
              {flow.displayName}
            </Link>
          </li>
        ))}
      </ul>
      {unnamed > 0 && <span>{t('and {count} more', { count: unnamed })}</span>}
    </div>
  );
}

export function describeUsage(usage?: AgentUsage): string {
  if (usage === undefined) {
    return '';
  }
  const names = usage.flows.map((flow) => flow.displayName).join(', ');
  if (usage.flows.length === 0) {
    return t('agentStillUsedUnnamed', { count: usage.total });
  }
  if (usage.total > usage.flows.length) {
    return t('agentStillUsedPartlyNamed', { count: usage.total, flows: names });
  }
  return t('agentStillUsedNamed', { count: usage.total, flows: names });
}

type DeleteAgentDialogProps = {
  agent: { id: string; displayName: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  children?: React.ReactNode;
};
