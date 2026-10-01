import { McpServerType } from '@activepieces/shared';
import { t } from 'i18next';

import { useMcpServerUrl } from '@/app/routes/mcp-server/mcp-server-url';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Label } from '@/components/ui/label';

export function McpCredentials() {
  const { serverUrl } = useMcpServerUrl({ serverType: McpServerType.PROJECT });

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
      },
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{t('Server URL')}</Label>
        <p className="text-xs text-gray-11">
          {t(
            'Use this URL to connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible client. Authentication is handled via OAuth.',
          )}
        </p>
        <CopyToClipboardInput textToCopy={serverUrl} useInput={true} />
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
