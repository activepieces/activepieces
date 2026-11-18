import { McpServerType } from '@activepieces/shared';
import { t } from 'i18next';

import { mcpClientCatalog } from '@/app/routes/mcp-server/mcp-client-catalog';
import { useMcpServerUrl } from '@/app/routes/mcp-server/mcp-server-url';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { flagsHooks } from '@/hooks/flags-hooks';

export function McpCredentials() {
  const { serverUrl } = useMcpServerUrl({ serverType: McpServerType.PROJECT });
  const { websiteName } = flagsHooks.useWebsiteBranding();

  const jsonConfiguration = {
    mcpServers: {
      [mcpClientCatalog.serverSlug(websiteName)]: {
        url: serverUrl,
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('Server URL')}</label>
        <p className="text-xs text-gray-11">
          {t(
            'Use this URL to connect any MCP client, like Claude, Cursor or VS Code.',
          )}
        </p>
        <div className="flex items-center gap-2">
          <div className="bg-gray-3/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {serverUrl}
          </div>
          <CopyButton value={serverUrl} />
        </div>
      </div>

      <CollapsibleJson
        json={jsonConfiguration}
        label={t('JSON Configuration')}
        description={t("Copy this into your MCP client's config.")}
        defaultOpen={false}
      />
    </div>
  );
}
