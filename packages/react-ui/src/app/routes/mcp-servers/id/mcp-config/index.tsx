import { useParams } from 'react-router-dom';

import { McpToolsSection } from './mcp-tools-section';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';

export const McpConfigPage = () => {
  const { mcpId } = useParams<{ mcpId: string }>();
  const { data: mcp, isLoading } = mcpHooks.useMcp(mcpId!);
  const { mutate: updateTools } = mcpHooks.updateTools(mcpId!);

  return <McpToolsSection mcp={mcp} isLoading={isLoading} onToolsUpdate={(tools) => updateTools(tools)} />;
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;
