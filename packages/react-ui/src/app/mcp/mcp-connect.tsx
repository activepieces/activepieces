import { ReloadIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Server,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { SimpleJsonViewer } from '@/components/simple-json-viewer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

const NODE_JS_DOWNLOAD_URL = 'https://nodejs.org/en/download';

// Utility function to mask token in URL
const maskToken = (url: string) => {
  return url.replace(/\/([^/]+)\/sse$/, '/•••••••••••••••••••••/sse');
};

export const replaceIpWithLocalhost = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
      parsed.hostname = 'localhost';
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const ExposeMcpNote = () => {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const hasBeenReplacedWithLocalhost =
    replaceIpWithLocalhost(publicUrl ?? '') !== publicUrl;
  if (!hasBeenReplacedWithLocalhost) {
    return null;
  }

  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>{t('Note')}: </strong>
        {t(
          'If you would like to expose your MCP server to the internet, please set the AP_FRONTEND_URL environment variable to the public URL of your Activepieces instance.',
        )}
      </AlertDescription>
    </Alert>
  );
};

const SecurityNote = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-default items-center gap-1 text-xs border border-warning/50 text-warning-300 dark:border-warning px-1.5 py-0.5 rounded-sm">
          <AlertTriangle className="h-3 w-3" />
          <span className="font-medium">{t('Security')}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">
          {t(
            'This URL grants access to your tools and data. Only share with trusted applications.',
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

// Define type for ButtonWithTooltip props
type ButtonWithTooltipProps = {
  tooltip: string;
  onClick: (e?: React.MouseEvent) => void;
  variant?:
  | 'ghost'
  | 'outline'
  | 'default'
  | 'destructive'
  | 'secondary'
  | 'link';
  icon: React.ReactNode;
  className?: string;
  disabled?: boolean;
  hasPermission?: boolean;
};

// Reusable ButtonWithTooltip component
const ButtonWithTooltip = ({
  tooltip,
  onClick,
  variant = 'ghost',
  icon,
  className = 'h-7 w-7',
  disabled = false,
  hasPermission = true,
}: ButtonWithTooltipProps) => (
  <PermissionNeededTooltip hasPermission={hasPermission}>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={className}
            onClick={onClick}
            disabled={disabled || !hasPermission}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </PermissionNeededTooltip>
);

const StepCard = ({
  stepNumber,
  title,
  children,
  icon,
}: {
  stepNumber: number;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div className="flex gap-3 p-4 rounded-lg bg-background">
    <div className="flex-shrink-0">
      <div className="h-6 w-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold">
        {stepNumber}
      </div>
    </div>
    <div className="flex-1 space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

const ConfigDisplay = ({
  mcpServerUrl,
  type,
  onRotateToken,
  isRotating = false,
  hasValidMcp = false,
  hasPermissionToWriteMcp = true,
}: {
  mcpServerUrl: string;
  type: 'npx' | 'url';
  onRotateToken: () => void;
  isRotating?: boolean;
  hasValidMcp?: boolean;
  hasPermissionToWriteMcp?: boolean;
}) => {
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);

  const toggleTokenVisibility = () => setShowToken(!showToken);
  const maskedUrl = showToken ? mcpServerUrl : maskToken(mcpServerUrl);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SecurityNote />
        </div>
        <div className="flex gap-2">
          <ButtonWithTooltip
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
            tooltip={t('Create a new URL. The current one will stop working.')}
            onClick={onRotateToken}
            variant="outline"
            disabled={isRotating || !hasValidMcp}
            hasPermission={hasPermissionToWriteMcp}
            icon={
              isRotating ? (
                <ReloadIcon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={t('Copy configuration')}
            onClick={(e) => {
              e?.stopPropagation();
              const config = {
                mcpServers: {
                  Activepieces:
                    type === 'npx'
                      ? {
                        command: 'npx',
                        args: ['-y', 'mcp-remote', mcpServerUrl],
                      }
                      : {
                        url: mcpServerUrl,
                      },
                },
              };
              navigator.clipboard.writeText(JSON.stringify(config, null, 2));
              toast({
                description: t('Configuration copied to clipboard'),
                duration: 3000,
              });
            }}
            variant="outline"
            icon={<Copy className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <SimpleJsonViewer
          hideCopyButton={true}
          data={{
            mcpServers: {
              Activepieces:
                type === 'npx'
                  ? {
                    command: 'npx',
                    args: ['-y', 'mcp-remote', maskedUrl],
                  }
                  : {
                    url: maskedUrl,
                  },
            },
          }}
        />
      </div>
    </div>
  );
};

export const McpConnectPage = () => {
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();
  const { mcpId } = useParams<{ mcpId: string }>();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const toggleTokenVisibility = () => setShowToken(!showToken);

  const { data: mcp, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);

  const mcpServerUrl =
    replaceIpWithLocalhost(publicUrl ?? '') +
    'api/v1/mcp/' +
    (mcp?.token || '') +
    '/sse';

  const hasPermissionToWriteMcp = true;
  const hasValidMcp = !!mcp;
  const maskedServerUrl = showToken ? mcpServerUrl : maskToken(mcpServerUrl);

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
      {/* Main Content with Vertical Tabs */}
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
                    {t('Open')}{' '}
                    <Badge variant="outline">{t('Windsurf')}</Badge> →{' '}
                    <Badge variant="outline">{t('Settings')}</Badge> →{' '}
                    <Badge variant="outline">{t('Advanced')}</Badge> →{' '}
                    <Badge variant="outline">{t('Cascade')}</Badge> →{' '}
                    <Badge variant="outline">{t('Add Server')}</Badge> →{' '}
                    <Badge variant="outline">
                      {t('Add custom server +')}
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

McpConnectPage.displayName = 'McpConnectPage';

export default McpConnectPage;
