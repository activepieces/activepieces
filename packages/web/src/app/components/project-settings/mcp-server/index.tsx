import { McpServerStatus } from '@activepieces/shared';
import { t } from 'i18next';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/custom/field';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticationSession } from '@/lib/authentication-session';

import { McpCredentials } from './mcp-credentials';
import { McpFlows } from './mcp-flows';
import { McpTools } from './mcp-tools';
import { mcpHooks } from './utils/mcp-hooks';

export const McpServerSettings = () => {
  const currentProjectId = authenticationSession.getProjectId();
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(
    currentProjectId!,
  );
  const { mutate: updateMcpServer, isPending: isUpdating } =
    mcpHooks.useUpdateMcpServer(currentProjectId!);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const isEnabled = mcpServer?.status === McpServerStatus.ENABLED;

  const handleStatusChange = (checked: boolean) => {
    updateMcpServer({
      status: checked ? McpServerStatus.ENABLED : McpServerStatus.DISABLED,
    });
  };

  return (
    <div className="w-full mt-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="mcp-access">{t('Enable MCP Access')}</FieldLabel>
          <FieldDescription>
            {t(
              "Allow external agents to read and trigger your project's flows securely.",
            )}
          </FieldDescription>
        </FieldContent>
        <Switch
          id="mcp-access"
          checked={isEnabled}
          onCheckedChange={handleStatusChange}
          disabled={isUpdating}
        />
      </Field>

      {isEnabled && mcpServer && (
        <div className="mt-6">
          <Tabs defaultValue="connection">
            <TabsList>
              <TabsTrigger value="connection">{t('Connection')}</TabsTrigger>
              <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="mt-4 pb-6" tabIndex={-1}>
              <McpCredentials mcpServer={mcpServer} />
            </TabsContent>

            <TabsContent
              value="tools"
              className="mt-4 space-y-6 pb-6"
              tabIndex={-1}
            >
              <div>
                <h3 className="font-semibold text-base mb-1">
                  {t('Internal Tools')}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t(
                    'Control which built-in Activepieces tools are available to agents via this MCP server.',
                  )}
                </p>
                <McpTools mcpServer={mcpServer} />
              </div>

              <div>
                <h3 className="font-semibold text-base mb-1">
                  {t('Your Flows')}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t(
                    'Flows with the MCP Trigger are exposed as tools on this server.',
                  )}
                </p>
                <McpFlows mcpServer={mcpServer} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

McpServerSettings.displayName = 'McpServerSettings';
