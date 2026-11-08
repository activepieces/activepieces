import { AgentToolType, ApEnvironment, ApFlagId } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { agentsApi } from '../../api/agents';
import { useAgentsAvailable } from '../../hooks/agents-hooks';

function useAgentToolsOn(): boolean {
  const { data: environment } = flagsHooks.useFlag<ApEnvironment>(
    ApFlagId.ENVIRONMENT,
  );
  const agentsAvailable = useAgentsAvailable();
  return agentsAvailable && environment === ApEnvironment.DEVELOPMENT;
}

function useCallableAgents({ enabled }: { enabled: boolean }) {
  const projectId = authenticationSession.getProjectId();
  return useQuery({
    queryKey: ['agents', 'callable-as-tools', projectId],
    enabled: enabled && !!projectId,
    queryFn: async () => {
      const page = await agentsApi.list({ projectId: projectId!, limit: 100 });
      return page.data;
    },
  });
}

function callsOtherAgents(toolTypes: AgentToolType[]): boolean {
  return toolTypes.includes(AgentToolType.AGENT);
}

export const agentToolsGate = {
  useAgentToolsOn,
  useCallableAgents,
  callsOtherAgents,
};
