import { ApFlagId, Permission, PopulatedMcpServer } from '@activepieces/shared';
import { t } from 'i18next';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpHooks } from './utils/mcp-hooks';

function maskToken(tokenValue: string): string {
  if (tokenValue.length <= 8) return '••••••••';
  return '••••••••' + tokenValue.slice(-4);
}

export function McpCredentials({ mcpServer }: McpCredentialsProps) {
  const [showToken, setShowToken] = useState(false);
  const toggleTokenVisibility = () => setShowToken(!showToken);
  const currentProjectId = authenticationSession.getProjectId();

  const { checkAccess } = useAuthorization();
  const { mutate: rotateToken, isPending: isRotating } =
    mcpHooks.useRotateMcpToken(currentProjectId!);

  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const serverUrl = `${(publicUrl ?? '').replace(/\/$/, '')}/mcp`;

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
        headers: {
          Authorization: `Bearer ${mcpServer?.token ?? ''}`,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('Server URL')}</label>
        <p className="text-xs text-muted-foreground">
          {t(
            'Use this URL to connect from Claude.ai, Cursor, Windsurf, or any MCP-compatible client.',
          )}
        </p>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {serverUrl}
          </div>
          <CopyButton textToCopy={serverUrl} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('Bearer Token')}</label>
        <p className="text-xs text-muted-foreground">
          {t('For clients that do not support OAuth (Cursor, Windsurf, etc.).')}
        </p>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {showToken ? mcpServer?.token : maskToken(mcpServer?.token ?? '')}
          </div>
          <ButtonWithTooltip
            className="h-9 w-9"
            tooltip={
              showToken ? t('Hide sensitive data') : t('Show sensitive data')
            }
            onClick={toggleTokenVisibility}
            variant="outline"
            icon={
              showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={t(
              'Create a new token. The current one will stop working.',
            )}
            onClick={() => rotateToken()}
            variant="outline"
            className="h-9 w-9"
            disabled={isRotating || !mcpServer?.status}
            hasPermission={checkAccess(Permission.WRITE_MCP)}
            icon={
              isRotating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
          />
          <CopyButton textToCopy={mcpServer?.token ?? ''} />
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
