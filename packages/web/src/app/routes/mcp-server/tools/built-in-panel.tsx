import { PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';

import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';

export function BuiltInPanel({
  mcpServer,
  projectId,
  isPending,
  onUpdateDisabledTools,
}: BuiltInPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t(
          'Control which built-in Activepieces tools are available to agents via this MCP server.',
        )}
      </p>
      <McpTools
        key={projectId}
        disabledTools={mcpServer.disabledTools}
        isPending={isPending}
        onUpdateDisabledTools={onUpdateDisabledTools}
      />
    </div>
  );
}

type BuiltInPanelProps = {
  mcpServer: PopulatedMcpServer;
  projectId: string | null;
  isPending: boolean;
  onUpdateDisabledTools: (tools: string[]) => void;
};
