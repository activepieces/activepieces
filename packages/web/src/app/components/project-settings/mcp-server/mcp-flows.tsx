import { FlowStatus, PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function McpFlows({ mcpServer }: McpFlowsProps) {
  const flows = mcpServer?.flows ?? [];

  if (flows.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          {t(
            'No MCP flows yet. Create a flow with an MCP Trigger to expose it as a tool on this server.',
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-xl border">
      {flows.map((flow) => {
        const isEnabled = flow.status === FlowStatus.ENABLED;
        return (
          <div
            key={flow.id}
            className="flex items-center justify-between px-3 py-2.5"
          >
            <span className="text-sm font-medium">
              {flow.version.displayName}
            </span>
            <Badge variant={isEnabled ? 'success' : 'outline'}>
              <div
                className={cn(
                  'size-1.5 rounded-full',
                  isEnabled ? 'bg-success-11' : 'bg-gray-11',
                )}
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
