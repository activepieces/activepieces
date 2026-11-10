import { AgentSummary, ApEnvironment, ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { agentsQueries, useAgentsAvailable } from '../../hooks/agents-hooks';

function useAgentToolsOn(): boolean {
  const { data: environment } = flagsHooks.useFlag<ApEnvironment>(
    ApFlagId.ENVIRONMENT,
  );
  const agentsAvailable = useAgentsAvailable();
  return agentsAvailable && environment === ApEnvironment.DEVELOPMENT;
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
