import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { authenticationSession } from '@/lib/authentication-session';

import { McpTools } from './mcp-built-in-tools';
import { McpCredentials } from './mcp-credentials';
import { McpFlows } from './mcp-flows';
import { McpTools } from './mcp-tools';
import { mcpHooks } from './utils/mcp-hooks';

export const McpServerSettings = () => {
  const currentProjectId = authenticationSession.getProjectId();
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(
    currentProjectId!,
  );

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full mt-4 pb-8">
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base">
              {t('Connection Details')}
            </h3>
            <a
              href="https://www.activepieces.com/docs/admin-guide/guides/setup-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {t('Setup Instructions')}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          {mcpServer && <McpCredentials mcpServer={mcpServer} />}
        </div>
        <div>
          <h3 className="font-semibold text-base mb-2">
            {t('Tools')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t(
              'Table tools are always available. Flows with "MCP Trigger" enabled appear here as tools.',
            )}
          </p>
          <McpTools flows={mcpServer?.flows ?? []} />
        </div>
      </div>
    </div>
  );
};

McpServerSettings.displayName = 'McpServerSettings';
