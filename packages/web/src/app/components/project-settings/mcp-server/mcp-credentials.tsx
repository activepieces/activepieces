import { ApFlagId, PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { flagsHooks } from '@/hooks/flags-hooks';

export function McpCredentials(_props: McpCredentialsProps) {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const serverUrl = `${(publicUrl ?? '').replace(/\/$/, '')}/mcp`;

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('Server URL')}</label>
        <p className="text-xs text-muted-foreground">
          {t(
            'Use this URL to connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible client. Authentication is handled via OAuth.',
          )}
        </p>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {serverUrl}
          </div>
          <CopyButton textToCopy={serverUrl} />
        </div>
      </div>

      <CollapsibleJson
        json={jsonConfiguration}
        label={t('JSON Configuration')}
        description={t(
          'Copy this into your MCP client config (Cursor, Windsurf, Claude Desktop, etc.).',
        )}
        defaultOpen={false}
      />
    </div>
  );
}

type McpCredentialsProps = {
  mcpServer: PopulatedMcpServer;
};
