import { useParams } from 'react-router-dom';

import { McpToolsSection } from './mcp-tools-section';

export const McpConfigPage = () => {
  const { mcpId } = useParams<{ mcpId: string }>();

  return <McpToolsSection mcpId={mcpId!} />;
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;
