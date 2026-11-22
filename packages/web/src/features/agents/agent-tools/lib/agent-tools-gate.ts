import { AgentSummary } from '@activepieces/shared';

import { authenticationSession } from '@/lib/authentication-session';

import { agentsQueries, useAgentsAvailable } from '../../hooks/agents-hooks';

function useAgentToolsOn(): boolean {
  return useAgentsAvailable();
}

function useProjectAgents(): {
  agents: AgentSummary[];
  complete: boolean;
} {
  const { data, hasNextPage } = agentsQueries.useAgents({
    projectId: authenticationSession.getProjectId() ?? undefined,
    enabled: useAgentToolsOn(),
  });
  return {
    agents: (data?.pages ?? []).flatMap((page) => page.data),
    complete: !!data && !hasNextPage,
  };
}

export const agentToolsGate = {
  useAgentToolsOn,
  useProjectAgents,
};
