import { t } from 'i18next';

import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';

import { McpToolsSection } from '../../../app/routes/mcp-servers/id/mcp-config/mcp-tools-section';

export const AgentToolSection = () => {
  const [mcpId] = useBuilderAgentState((state) => [state.agent.mcpId]);

  const { data: mcp, isLoading, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);

  const { mutate: updateTools } = mcpHooks.useUpdateTools(mcpId!, refetchMcp);

  return (
    <McpToolsSection
      mcp={mcp}
      isLoading={isLoading}
      description={t('Give capabilities to your agent by adding tools')}
      onToolsUpdate={updateTools}
    />
  );
};
