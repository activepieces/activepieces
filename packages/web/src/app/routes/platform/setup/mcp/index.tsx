import { ApFlagId, McpServerStatus } from '@activepieces/shared';
import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/custom/field';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Switch } from '@/components/ui/switch';
import { flagsHooks } from '@/hooks/flags-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage() {
  const { data: mcpServer, isLoading } =
    platformMcpHooks.usePlatformMcpServer();
  const { mutate: updateMcpServer, isPending: isUpdating } =
    platformMcpHooks.useUpdatePlatformMcpServer();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);

  if (isLoading) {
    return (
      <CenteredPage
        title={t('Platform MCP Server')}
        description={t(
          'Configure the platform-wide MCP server used by the AI Chat assistant.',
        )}
      >
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </CenteredPage>
    );
  }

  const isEnabled = mcpServer?.status === McpServerStatus.ENABLED;
  const serverUrl = `${(publicUrl ?? '').replace(/\/$/, '')}/mcp/platform`;

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
      },
    },
  };

  return (
    <CenteredPage
      title={t('Platform MCP Server')}
      description={t(
        'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
      )}
    >
      <div className="space-y-6">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="platform-mcp-access">
              {t('Enable Platform MCP')}
            </FieldLabel>
            <FieldDescription>
              {t(
                'Allow the AI Chat and external agents to access tools across all projects on this platform.',
              )}
            </FieldDescription>
          </FieldContent>
          <Switch
            id="platform-mcp-access"
            checked={isEnabled}
            onCheckedChange={(checked) =>
              updateMcpServer({
                status: checked
                  ? McpServerStatus.ENABLED
                  : McpServerStatus.DISABLED,
              })
            }
            disabled={isUpdating}
          />
        </Field>

        {isEnabled && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('Server URL')}</label>
              <p className="text-xs text-muted-foreground">
                {t(
                  'Use this URL to connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible client. Authentication is handled via OAuth.',
                )}
              </p>
              <div className="flex items-center gap-2">
                <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto font-mono">
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

            <div>
              <h3 className="font-semibold text-base mb-1">{t('Tools')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t(
                  'Control which built-in tools are available to the AI Chat and external agents via the platform MCP server.',
                )}
              </p>
              <McpTools
                enabledTools={mcpServer.enabledTools}
                isPending={isUpdating}
                onUpdateEnabledTools={(tools) =>
                  updateMcpServer({ enabledTools: tools })
                }
              />
            </div>
          </div>
        )}
      </div>
    </CenteredPage>
  );
}
