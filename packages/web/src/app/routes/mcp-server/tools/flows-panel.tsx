import { PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';

import { McpFlows } from '@/app/components/project-settings/mcp-server/mcp-flows';

export function FlowsPanel({ mcpServer }: FlowsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t('Flows with the MCP Trigger are exposed as tools on this server.')}
      </p>
      <McpFlows mcpServer={mcpServer} />
    </div>
  );
}

type FlowsPanelProps = {
  mcpServer: PopulatedMcpServer;
};
