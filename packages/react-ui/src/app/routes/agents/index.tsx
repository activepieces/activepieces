import { useQuery, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot } from 'lucide-react';
import { useState } from 'react';

import { TableTitle } from '@/components/custom/table-title';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { flagsHooks } from '@/hooks/flags-hooks';
import { Agent, ApFlagId } from '@activepieces/shared';

import { AgentBuilder } from './agent-builder';
import { AgentCard } from './agent-card';
import { agentsApi } from './agents-api';
import { CreateAgentButton } from './create-agent-button';

export const AgentsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();

  const { data: isAgentsEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_ENABLED,
  );

  const {
    data: agentsPage,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  });

  const agents = agentsPage?.data || [];

  const handleOpenBuilder = async (agent?: Agent) => {
    if (agent) {
      setSelectedAgent(agent);
      setIsOpen(true);
    }
  };

  const handleAgentCreated = (newAgent: Agent) => {
    refetch();
    setSelectedAgent(newAgent);
    setIsOpen(true);
  };

  const deleteAgentMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.delete(agentId),
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <TableTitle
          description={t('Build and manage your team of digital workers')}
        >
          {t('Agents')}
        </TableTitle>
        <AgentBuilder
          isOpen={isOpen}
          refetch={refetch}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSelectedAgent(undefined);
            }
          }}
          agent={selectedAgent}
          trigger={
            <CreateAgentButton
              onAgentCreated={handleAgentCreated}
              isAgentsEnabled={isAgentsEnabled ?? false}
            />
          }
        />
      </div>

      <div className="mt-4">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-gradient-to-br from-background to-muted/20">
            <div className="w-32 h-32 mb-6 relative">
              <Bot className="w-full h-full" />
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent from-primary to-primary/60">
              {t('No agents yet')}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t(
                'Get started by creating your first agent to automate tasks and workflows',
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} onClick={() => handleOpenBuilder(agent)}>
                <AgentCard
                  taskCompleted={agent.taskCompleted}
                  title={agent.displayName}
                  description={agent.description || ''}
                  picture={agent.profilePictureUrl}
                  onDelete={() => deleteAgentMutation.mutateAsync(agent.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
