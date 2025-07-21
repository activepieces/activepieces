import { t } from 'i18next';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { TableTitle } from '@/components/custom/table-title';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { Agent, ApFlagId } from '@activepieces/shared';

import agentsGroupImage from '../../../assets/img/custom/agents-group.png';
import { AgentCard } from '../../../features/agents/agent-card';
import { CreateAgentButton } from '../../../features/agents/create-agent-button';
import { agentHooks } from '../../../features/agents/lib/agent-hooks';

import { AgentBuilder } from './builder';

export const AgentsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();
  const { platform } = platformHooks.useCurrentPlatform();

  const { data: isisAgentsConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_CONFIGURED,
  );

  const { data: agentsPage, isLoading, refetch } = agentHooks.useList();

  const agents = agentsPage?.data || [];

  const handleOpenBuilder = async (agent?: Agent) => {
    if (agent) {
      setSelectedAgent(agent);
      setIsOpen(true);
    }
  };

  const handleAgentCreated = (newAgent: Agent) => {
    setIsOpen(true);
    refetch();
    setSelectedAgent(newAgent);
  };

  const deleteAgentMutation = agentHooks.useDelete();

  const handleDeleteAgent = async (agentId: string) => {
    await deleteAgentMutation.mutateAsync(agentId);
    refetch();
  };

  if (isLoading) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <LockedFeatureGuard
      featureKey="AGENTS"
      locked={!platform.plan.agentsEnabled}
      lockTitle={t('AI Agents')}
      lockDescription={t(
        'Create AI agents that can interact with all pieces and be used inside your flows',
      )}
    >
      <div className="flex items-center justify-between">
        <TableTitle
          beta={true}
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
              isAgentsConfigured={isisAgentsConfigured ?? false}
            />
          }
        />
      </div>

      <div className="mt-4">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-gradient-to-br from-background to-muted/20">
            <img
              src={agentsGroupImage}
              alt="Agents"
              className="w-48 h-48 mb-4"
            />
            <p className="text-muted-foreground text-center max-w-md">
              {t(
                'Get started by creating your first agent. It can interact with all pieces and be used inside your flows.',
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} onClick={() => handleOpenBuilder(agent)}>
                <AgentCard
                  title={agent.displayName}
                  description={agent.description || ''}
                  picture={agent.profilePictureUrl}
                  onDelete={() => handleDeleteAgent(agent.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </LockedFeatureGuard>
  );
};
