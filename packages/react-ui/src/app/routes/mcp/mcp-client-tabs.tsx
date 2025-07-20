import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import {
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Server,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { useTheme } from '@/components/theme-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

import { SimpleJsonViewer } from '../../../components/simple-json-viewer';

type McpClientTabsProps = {
  mcpServerUrl: string;
  hasTools?: boolean; // Whether there are any connection or flow tools
  onRotateToken?: () => void;
  isRotating?: boolean;
  hasValidMcp?: boolean;
  hasPermissionToWriteMcp?: boolean;
};

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
    <div>
      <b>{t('Note')}: </b>
      {t(
        'If you would like to expose your MCP server to the internet, please set the AP_FRONTEND_URL environment variable to the public URL of your Activepieces instance.',
      )}
    </div>
  );
};
const SecurityNote = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-default items-center gap-1 text-xs border  border-warning/50 text-warning-300 dark:border-warning  px-1.5 py-0.5 rounded-sm">
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
  onRotateToken?: () => void;
  isRotating?: boolean;
  hasValidMcp?: boolean;
  hasPermissionToWriteMcp?: boolean;
}) => {
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);

  const toggleTokenVisibility = () => setShowToken(!showToken);
  const maskedUrl = showToken ? mcpServerUrl : maskToken(mcpServerUrl);

  return (
    <div className="space-y-2">
      <ExposeMcpNote />
      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {t('Server Configuration')}
            </span>
            <SecurityNote></SecurityNote>
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

            {onRotateToken && (
              <ButtonWithTooltip
                tooltip={t(
                  'Create a new URL. The current one will stop working.',
                )}
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
            )}

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
        <div className="bg-background">
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
    </div>
  );
};

export const McpClientTabs = ({
  mcpServerUrl,
  hasTools = false,
  onRotateToken,
  isRotating = false,
  hasValidMcp = false,
  hasPermissionToWriteMcp = true,
}: McpClientTabsProps) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('claude');
  const [isExpanded, setIsExpanded] = useState(!hasTools);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const toggleTokenVisibility = () => setShowToken(!showToken);
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const maskedServerUrl = showToken ? mcpServerUrl : maskToken(mcpServerUrl);

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
      label: t('Server/Other'),
      icon: Server,
      isImage: false,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'claude':
        return (
          <div className="space-y-4">
            <Alert variant="warning" className="mb-4">
              <AlertDescription className="text-sm">
                <p>
                  {t('Note: MCPs only work with')}{' '}
                  <Link
                    to="https://claude.ai/download"
                    className="underline"
                    target="_blank"
                  >
                    {t('Claude Desktop')}
                  </Link>
                  {t(', not the web version.')}
                </p>
              </AlertDescription>
            </Alert>
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">{t('Prerequisites:')}</span>{' '}
                {t('Install')}{' '}
                <Link
                  to={NODE_JS_DOWNLOAD_URL}
                  className="underline"
                  target="_blank"
                >
                  {t('Node.js')}
                </Link>{' '}
                {t('and')}{' '}
                <Link
                  to="https://claude.ai/download"
                  className="underline"
                  target="_blank"
                >
                  {t('Claude Desktop')}
                </Link>
              </li>
              <li>
                <span className="font-semibold">{t('Open Settings:')}</span>{' '}
                {t('Click the menu and select')}{' '}
                <strong>{t('Settings')}</strong> →{' '}
                <strong>{t('Developer')}</strong>
              </li>
              <li>
                <span className="font-semibold">{t('Configure MCP:')}</span>{' '}
                {t('Click')} <strong>{t('Edit Config')}</strong>{' '}
                {t('and paste the configuration below')}
              </li>
              <li>
                <span className="font-semibold">{t('Save and Restart:')}</span>{' '}
                {t('Save the config and restart Claude Desktop')}
              </li>
            </ol>
            <ConfigDisplay
              mcpServerUrl={mcpServerUrl}
              type="npx"
              onRotateToken={onRotateToken}
              isRotating={isRotating}
              hasValidMcp={hasValidMcp}
              hasPermissionToWriteMcp={hasPermissionToWriteMcp}
            />
          </div>
        );
      case 'cursor':
        return (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">{t('Open Settings:')}</span>{' '}
                {t('Navigate to')} <strong>{t('Settings')}</strong> →{' '}
                <strong>{t('Cursor Settings')}</strong> →{' '}
                <strong>{t('MCP')}</strong>
              </li>
              <li>
                <span className="font-semibold">{t('Add Server:')}</span>{' '}
                {t('Click')} <strong>{t('Add new global MCP server')}</strong>
              </li>
              <li>
                <span className="font-semibold">{t('Configure:')}</span>{' '}
                {t('Paste the configuration below and save')}
              </li>
            </ol>
            <ConfigDisplay
              mcpServerUrl={mcpServerUrl}
              type="url"
              onRotateToken={onRotateToken}
              isRotating={isRotating}
              hasValidMcp={hasValidMcp}
              hasPermissionToWriteMcp={hasPermissionToWriteMcp}
            />
          </div>
        );
      case 'windsurf':
        return (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">{t('Open Settings:')}</span>{' '}
                {t('Use either method:')}
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>
                    {t('Go to')} <strong>{t('Windsurf')}</strong> →{' '}
                    <strong>{t('Settings')}</strong> →{' '}
                    <strong>{t('Advanced Settings')}</strong>
                  </li>
                  <li>
                    {t('Open Command Palette and select')}{' '}
                    <strong>{t('Windsurf Settings Page')}</strong>
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-semibold">
                  {t('Navigate to Cascade:')}
                </span>{' '}
                {t('Select')} <strong>{t('Cascade')}</strong>{' '}
                {t('in the sidebar')}
              </li>
              <li>
                <span className="font-semibold">{t('Add Server:')}</span>{' '}
                {t('Click')} <strong>{t('Add Server')}</strong> →{' '}
                <strong>{t('Add custom server +')}</strong>
              </li>
              <li>
                <span className="font-semibold">{t('Configure:')}</span>{' '}
                {t('Paste the configuration below and save')}
              </li>
            </ol>
            <ConfigDisplay
              mcpServerUrl={mcpServerUrl}
              type="url"
              onRotateToken={onRotateToken}
              isRotating={isRotating}
              hasValidMcp={hasValidMcp}
              hasPermissionToWriteMcp={hasPermissionToWriteMcp}
            />
          </div>
        );
      case 'server':
        return (
          <div className="space-y-4">
            <ExposeMcpNote />
            <div className="space-y-3 w-full">
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">{t('Server URL')}</h3>
                <SecurityNote></SecurityNote>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`font-mono ${
                      theme === 'dark'
                        ? 'bg-muted text-foreground'
                        : 'bg-muted/30 text-foreground/90'
                    } cursor-text w-full border rounded-md px-3 py-2.5 text-sm overflow-x-auto`}
                  >
                    {maskedServerUrl}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <ButtonWithTooltip
                      tooltip={
                        showToken
                          ? t('Hide sensitive data')
                          : t('Show sensitive data')
                      }
                      onClick={toggleTokenVisibility}
                      variant="outline"
                      className="h-9 w-9"
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
                        'Create a new URL. The current one will stop working.',
                      )}
                      onClick={onRotateToken ? onRotateToken : () => {}}
                      variant="outline"
                      className="h-9 w-9"
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
                      tooltip={t('Copy URL')}
                      onClick={() => {
                        navigator.clipboard.writeText(mcpServerUrl);
                        toast({
                          description: t('URL copied to clipboard'),
                          duration: 3000,
                        });
                      }}
                      variant="outline"
                      className="h-9 w-9"
                      icon={<Copy className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={`mb-8 ${
        theme === 'dark' ? 'bg-card border-border' : 'bg-[#f7f6f4] border-none'
      }`}
    >
      <CardContent className="p-5 pt-5">
        <div className="space-y-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={toggleExpanded}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground text-lg">
                {t('Client Setup Instructions')}
              </h3>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64">
                    <span className="text-sm">
                      {t(
                        'After changing connections or flows, reconnect your MCP server for changes to take effect.',
                      )}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click event from firing
                toggleExpanded();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isExpanded && (
            <>
              <p className="text-muted-foreground text-sm">
                {t(
                  'Follow these steps to set up MCP in your preferred client. This enables your AI assistant to access your tools.',
                )}
              </p>

              <div className="flex flex-wrap gap-2 mb-4 mt-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={'outline'}
                    className={`flex items-center gap-2 ${
                      activeTab === tab.id
                        ? theme === 'dark'
                          ? 'bg-muted'
                          : 'bg-white'
                        : theme === 'dark'
                        ? 'bg-card/50'
                        : 'bg-[#f7f6f4]'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click event from firing
                      setActiveTab(tab.id);
                    }}
                  >
                    {tab.isImage ? (
                      <img
                        src={tab.icon as string}
                        alt={`${t(tab.label)} ${t('icon')}`}
                        className="w-4 h-4"
                      />
                    ) : (
                      <tab.icon className="h-4 w-4" />
                    )}
                    {tab.label}
                  </Button>
                ))}
              </div>

              <div className="p-1" onClick={(e) => e.stopPropagation()}>
                {renderTabContent()}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
