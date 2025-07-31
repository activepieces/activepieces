import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Server } from 'lucide-react';
import { useParams } from 'react-router-dom';

import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

import { ConfigDisplay } from './config-display';
import { ExposeMcpNote } from './expose-mcp-note';
import { mcpConnectUtils } from './mcp-connect-utils';
import { McpServerUrlBox } from './mcp-server-url-box';
import { StepCard } from './step-card';

export const McpConnectPage = () => {
  const { toast } = useToast();
  const { mcpId } = useParams<{ mcpId: string }>();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);

  const { data: mcp, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);

  const mcpServerUrl =
    mcpConnectUtils.replaceIpWithLocalhost(publicUrl ?? '') +
    'api/v1/mcp/' +
    (mcp?.token || '') +
    '/sse';

  const hasPermissionToWriteMcp = true;
  const hasValidMcp = !!mcp;

  const rotateMutation = useMutation({
    mutationFn: async (mcpId: string) => {
      return mcpApi.rotateToken(mcpId);
    },
    onSuccess: () => {
      toast({
        description: t('Token rotated successfully'),
        duration: 3000,
      });
      refetchMcp();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to rotate token'),
        duration: 5000,
      });
    },
  });

  const handleRotateToken = () => {
    if (!mcp?.id) return;
    rotateMutation.mutate(mcp.id);
  };

  const tabs = [
    {
      id: 'claude',
      label: t('Claude'),
      icon: claude,
      isImage: true,
    },
    {
      id: 'cursor',
      label: t('Cursor'),
      icon: cursor,
      isImage: true,
    },
    {
      id: 'windsurf',
      label: t('Windsurf'),
      icon: windsurf,
      isImage: true,
    },
    {
      id: 'server',
      label: t('Other'),
      icon: Server,
      isImage: false,
    },
  ];

  return (
    <div className="w-full h-full">
      <Tabs
        orientation="vertical"
        defaultValue="claude"
        className="w-full flex items-start gap-6"
      >
        <TabsList className="shrink-0 grid grid-cols-1 w-48 p-0 bg-background">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="border-l-2 border-transparent justify-start rounded-none data-[state=active]:shadow-none data-[state=active]:border-foreground data-[state=active]:bg-muted py-2 px-4 gap-3 w-full"
            >
              {tab.isImage ? (
                <img
                  src={tab.icon as string}
                  alt={tab.label}
                  className="w-4 h-4"
                />
              ) : (
                <tab.icon className="h-4 w-4" />
              )}
              <span className="font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">
          <TabsContent value="claude" className="mt-0">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('Setup')}</h3>
                <div className="space-y-3">
                  <StepCard stepNumber={1} title={t('Add MCP Server')}>
                    {t('Go to')}{' '}
                    <a
                      href="https://claude.ai/settings/integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      claude.ai/settings/integrations
                    </a>{' '}
                    → <Badge variant="outline">{t('Add More')}</Badge>
                    <p className="mt-3">
                      {t(
                        'This feature is only available with a Claude Pro subscription. Alternatively, you can use the Claude desktop application to connect to the MCP server.',
                      )}
                    </p>
                  </StepCard>

                  <StepCard
                    stepNumber={2}
                    title={t('Configure Claude Integration')}
                  >
                    <div className="mt-3">
                      {t('Open Claude')} →{' '}
                      <Badge variant="outline">{t('Settings')}</Badge> →{' '}
                      <Badge variant="outline">{t('Developer')}</Badge> →{' '}
                      <Badge variant="outline">{t('Edit Config')}</Badge> →{' '}
                      <Badge variant="outline">
                        {t('Open claude_desktop_config.json')}
                      </Badge>
                      <br />
                      <br />
                      {t(
                        'Paste the configuration below and save, then quit and restart Claude.',
                      )}
                      <br />
                      <br />
                      <ConfigDisplay
                        mcpServerUrl={mcpServerUrl}
                        type="claude"
                        onRotateToken={handleRotateToken}
                        isRotating={rotateMutation.isPending}
                        hasValidMcp={hasValidMcp}
                        hasPermissionToWriteMcp={hasPermissionToWriteMcp}
                      />
                    </div>
                  </StepCard>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cursor" className="mt-0">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('Setup')}</h3>
                <div className="space-y-3">
                  <StepCard stepNumber={1} title={t('Configure Cursor')}>
                    {t('Open Cursor')} →{' '}
                    <Badge variant="outline">{t('Settings')}</Badge> →{' '}
                    <Badge variant="outline">{t('Cursor Settings')}</Badge> →{' '}
                    <Badge variant="outline">{t('MCP')}</Badge> →{' '}
                    <Badge variant="outline">
                      {t('Add new global MCP server')}
                    </Badge>
                    <br />
                    <br />
                    {t('Paste the configuration below and save.')}
                    <div className="mt-3">
                      <ConfigDisplay
                        mcpServerUrl={mcpServerUrl}
                        type="cursor"
                        onRotateToken={handleRotateToken}
                        isRotating={rotateMutation.isPending}
                        hasValidMcp={hasValidMcp}
                        hasPermissionToWriteMcp={hasPermissionToWriteMcp}
                      />
                    </div>
                  </StepCard>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="windsurf" className="mt-0">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('Setup')}</h3>
                <div className="space-y-3">
                  <StepCard stepNumber={1} title={t('Configure Windsurf')}>
                    {t('Open')} <Badge variant="outline">{t('Windsurf')}</Badge>{' '}
                    → <Badge variant="outline">{t('Settings')}</Badge> →{' '}
                    <Badge variant="outline">{t('Advanced')}</Badge> →{' '}
                    <Badge variant="outline">{t('Cascade')}</Badge> →{' '}
                    <Badge variant="outline">{t('Add Server')}</Badge> →{' '}
                    <Badge variant="outline">{t('Add custom server +')}</Badge>
                    <br />
                    <br />
                    {t('Paste the configuration below and save.')}
                    <div className="mt-3">
                      <ConfigDisplay
                        mcpServerUrl={mcpServerUrl}
                        type="windsurf"
                        onRotateToken={handleRotateToken}
                        isRotating={rotateMutation.isPending}
                        hasValidMcp={hasValidMcp}
                        hasPermissionToWriteMcp={hasPermissionToWriteMcp}
                      />
                    </div>
                  </StepCard>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="server" className="mt-0">
            <div className="space-y-4">
              <ExposeMcpNote />
              <McpServerUrlBox
                mcpServerUrl={mcpServerUrl}
                onRotateToken={handleRotateToken}
                isRotating={rotateMutation.isPending}
                hasValidMcp={hasValidMcp}
                hasPermissionToWriteMcp={hasPermissionToWriteMcp}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
