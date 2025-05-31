import { ReloadIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Server, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
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
import { StepCard } from './step-card';

const NODE_JS_DOWNLOAD_URL = 'https://nodejs.org/en/download';

export const McpConnectPage = () => {
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();
  const { mcpId } = useParams<{ mcpId: string }>();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const toggleTokenVisibility = () => setShowToken(!showToken);

  const { data: mcp, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);

  const mcpServerUrl =
    mcpConnectUtils.replaceIpWithLocalhost(publicUrl ?? '') +
    'api/v1/mcp/' +
    (mcp?.token || '') +
    '/sse';

  const hasPermissionToWriteMcp = true;
  const hasValidMcp = !!mcp;
  const maskedServerUrl = showToken
    ? mcpServerUrl
    : mcpConnectUtils.maskToken(mcpServerUrl);

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
                  <StepCard stepNumber={1} title={t('Install Prerequisites')}>
                    {t('Download and install')}{' '}
                    <a
                      href={NODE_JS_DOWNLOAD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Node.js
                    </a>{' '}
                    {t('and')}{' '}
                    <a
                      href="https://claude.ai/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Claude Desktop
                    </a>
                    .
                  </StepCard>

                  <StepCard
                    stepNumber={2}
                    title={t('Configure Claude Desktop')}
                  >
                    {t('Open Claude Desktop')} → {t('Menu')} →{' '}
                    <Badge variant="outline">{t('Settings')}</Badge> →{' '}
                    <Badge variant="outline">{t('Developer')}</Badge> →{' '}
                    <Badge variant="outline">{t('Edit Config')}</Badge>.{' '}
                    {t(
                      'Paste the configuration below, save, and restart Claude Desktop.',
                    )}
                    <div className="mt-3">
                      <ConfigDisplay
                        mcpServerUrl={mcpServerUrl}
                        type="npx"
                        onRotateToken={handleRotateToken}
                        isRotating={rotateMutation.isPending}
                        hasValidMcp={!!mcp}
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
                    . {t('Paste the configuration below and save.')}
                    <div className="mt-3">
                      <ConfigDisplay
                        mcpServerUrl={mcpServerUrl}
                        type="url"
                        onRotateToken={handleRotateToken}
                        isRotating={rotateMutation.isPending}
                        hasValidMcp={!!mcp}
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
                    <Badge variant="outline">{t('Add custom server +')}</Badge>.{' '}
                    {t('Paste the configuration below and save.')}
                    <div className="mt-3">
                      <ConfigDisplay
                        mcpServerUrl={mcpServerUrl}
                        type="url"
                        onRotateToken={handleRotateToken}
                        isRotating={rotateMutation.isPending}
                        hasValidMcp={!!mcp}
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

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('Server URL')}</h3>

                <div className="flex items-center gap-2">
                  <div className="font-mono bg-muted/50 border rounded-lg px-3 py-2 text-sm flex-1 overflow-x-auto">
                    {maskedServerUrl}
                  </div>
                  <div className="flex items-center gap-1">
                    <ButtonWithTooltip
                      tooltip={showToken ? t('Hide') : t('Show')}
                      onClick={toggleTokenVisibility}
                      variant="outline"
                      className="h-8 w-8"
                      icon={
                        showToken ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )
                      }
                    />
                    <ButtonWithTooltip
                      tooltip={t('Rotate')}
                      onClick={handleRotateToken}
                      variant="outline"
                      className="h-8 w-8"
                      disabled={rotateMutation.isPending || !hasValidMcp}
                      hasPermission={hasPermissionToWriteMcp}
                      icon={
                        rotateMutation.isPending ? (
                          <ReloadIcon className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )
                      }
                    />
                    <ButtonWithTooltip
                      tooltip={t('Copy')}
                      onClick={() => {
                        navigator.clipboard.writeText(mcpServerUrl);
                        toast({
                          description: t('Copied'),
                          duration: 2000,
                        });
                      }}
                      variant="outline"
                      className="h-8 w-8"
                      icon={<Copy className="h-3 w-3" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
