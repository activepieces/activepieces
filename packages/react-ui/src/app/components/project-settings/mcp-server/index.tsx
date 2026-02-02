import { t } from 'i18next';
import { CheckCircle, CircleDot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { LoadingSpinner } from '@/components/ui/spinner';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { Switch } from '@/components/ui/switch';
import { authenticationSession } from '@/lib/authentication-session';
import { McpServerStatus, FlowStatus } from '@activepieces/shared';

import { McpCredentials } from './mcp-credentials';
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
      {mcpServer?.status === McpServerStatus.ENABLED && (
        <div className="mt-8 space-y-8">
          <div>
            <h3 className="font-semibold text-base mb-2">
              {t('Connection Details')}
            </h3>
            {mcpServer && <McpCredentials mcpServer={mcpServer} />}
          </div>
          <div>
            <h3 className="font-semibold text-base mb-2">
              {t('Available Flows')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t(
                'Any flow that has the "MCP Trigger" turned on will show up here and can be accessed from your MCP server.',
              )}
            </p>
            <div className="space-y-2">
              {(mcpServer?.flows?.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t('No MCP flows available')}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-w-xs">
                  {mcpServer.flows.map((flow) => {
                    const isEnabled = flow.status === FlowStatus.ENABLED;
                    const flowUrl = `/project/${flow.projectId}/flow/${flow.id}`;
                    return (
                      <div
                        key={flow.id}
                        className="flex items-center gap-2 w-full max-w-xs"
                        style={{ minHeight: 32 }}
                      >
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <Button
                            variant="link"
                            className="text-sm font-medium p-0 h-auto min-w-0 text-secondary break-all"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(
                                flowUrl,
                                '_blank',
                                'noopener,noreferrer',
                              );
                            }}
                            tabIndex={-1}
                          >
                            {flow.version.displayName}
                          </Button>
                        </div>
                        <StatusIconWithText
                          icon={isEnabled ? CheckCircle : CircleDot}
                          text={isEnabled ? t('On') : t('Off')}
                          variant={isEnabled ? 'success' : 'default'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

McpServerSettings.displayName = 'McpServerSettings';
