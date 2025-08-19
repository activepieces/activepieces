import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';

import { McpEmptyTools } from './empty-tools';
import { McpToolsSection } from './mcp-tools-section';

export const McpConfigPage = () => {
  const { mcpId } = useParams<{ mcpId: string }>();
  const { data: mcp, isLoading, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);
  const { mutate: updateTools } = mcpHooks.useUpdateTools(mcpId!, refetchMcp);

  return (
    <McpToolsSection
      mcp={mcp}
      isLoading={isLoading}
      description={t('Give capabilities to your server by adding tools')}
      onToolsUpdate={(tools) => updateTools(tools)}
      emptyState={<McpEmptyTools />}
    />
  );
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;
