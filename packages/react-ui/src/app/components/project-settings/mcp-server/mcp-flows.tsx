import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import { PopulatedMcpServer, FlowStatus } from '@activepieces/shared';

export function McpFlows({ mcpServer }: McpFlowsProps) {
  const flows = mcpServer?.flows ?? [];

  if (flows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('No MCP flows available')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flows.map((flow) => {
        const isEnabled = flow.status === FlowStatus.ENABLED;
        return (
          <div key={flow.id} className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {flow.version.displayName}
            </span>
            <Badge
              variant={isEnabled ? 'success' : 'outline'}
              className="flex items-center gap-1.5"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isEnabled ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span>{isEnabled ? t('On') : t('Off')}</span>
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

type McpFlowsProps = {
  mcpServer: PopulatedMcpServer;
};
