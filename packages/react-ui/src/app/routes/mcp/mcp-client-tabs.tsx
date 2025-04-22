import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Link as LinkIcon,
  Server,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

import { SimpleJsonViewer } from '../../../components/simple-json-viewer';

type McpClientTabsProps = {
  mcpServerUrl: string;
  hasTools?: boolean; // Whether there are any connection or flow tools
  onRotateToken?: () => void;
  isRotating?: boolean;
  hasValidMcp?: boolean;
};

const NODE_JS_DOWNLOAD_URL = 'https://nodejs.org/en/download';

// Utility function to mask token in URL
const maskToken = (url: string) => {
  return url.replace(/\/([^/]+)\/sse$/, '/•••••••••••••••••••••/sse');
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
};

// Reusable ButtonWithTooltip component
const ButtonWithTooltip = ({
  tooltip,
  onClick,
  variant = 'ghost',
  icon,
  className = 'h-7 w-7',
  disabled = false,
}: ButtonWithTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={className}
          onClick={onClick}
          disabled={disabled}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ConfigDisplay = ({
  mcpServerUrl,
  type,
  onRotateToken,
  isRotating = false,
  hasValidMcp = false,
}: {
  mcpServerUrl: string;
  type: 'npx' | 'url';
  onRotateToken?: () => void;
  isRotating?: boolean;
  hasValidMcp?: boolean;
}) => {
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);

  const toggleTokenVisibility = () => setShowToken(!showToken);
  const maskedUrl = showToken ? mcpServerUrl : maskToken(mcpServerUrl);

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              MCP Server Configuration
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    This URL contains a sensitive security token. Only share it
                    with trusted applications and services.
                    {onRotateToken &&
                      ' You can rotate the token if you suspect it has been compromised.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex gap-2">
            <ButtonWithTooltip
              tooltip={
                showToken ? 'Hide sensitive data' : 'Show sensitive data'
              }
              onClick={toggleTokenVisibility}
              variant="outline"
              icon={
                showToken ? (
                  <EyeOff className="h-4 w-4 text-primary" />
                ) : (
                  <Eye className="h-4 w-4 text-primary" />
                )
              }
            />

            {onRotateToken && (
              <ButtonWithTooltip
                tooltip="Generate a new token for security. This will invalidate the current URL."
                onClick={onRotateToken}
                variant="outline"
                disabled={isRotating || !hasValidMcp}
                icon={
                  isRotating ? (
                    <ReloadIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 text-primary" />
                  )
                }
              />
            )}

            <ButtonWithTooltip
              tooltip="Copy configuration"
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
                  description: 'Configuration copied to clipboard',
                  duration: 3000,
                });
              }}
              variant="outline"
              icon={<Copy className="h-4 w-4 text-primary" />}
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
      label: 'Claude',
      icon: claude,
      isImage: true,
    },
    {
      id: 'cursor',
      label: 'Cursor',
      icon: cursor,
      isImage: true,
    },
    {
      id: 'windsurf',
      label: 'Windsurf',
      icon: windsurf,
      isImage: true,
    },
    {
      id: 'server',
      label: 'Server/Other',
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
                  Note: MCPs currently only work with{' '}
                  <Link
                    to="https://claude.ai/download"
                    className="underline"
                    target="_blank"
                  >
                    Claude Desktop
                  </Link>
                  , not the web version.
                </p>
              </AlertDescription>
            </Alert>
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">Prerequisites:</span> Install{' '}
                <Link
                  to={NODE_JS_DOWNLOAD_URL}
                  className="underline"
                  target="_blank"
                >
                  Node.js
                </Link>{' '}
                and{' '}
                <Link
                  to="https://claude.ai/download"
                  className="underline"
                  target="_blank"
                >
                  Claude Desktop
                </Link>
              </li>
              <li>
                <span className="font-semibold">Open Settings:</span> Click the
                menu and select <strong>Settings</strong> →{' '}
                <strong>Developer</strong>
              </li>
              <li>
                <span className="font-semibold">Configure MCP:</span> Click{' '}
                <strong>Edit Config</strong> and paste the configuration below
              </li>
              <li>
                <span className="font-semibold">Save and Restart:</span> Save
                the config and restart Claude Desktop
              </li>
            </ol>
            <ConfigDisplay
              mcpServerUrl={mcpServerUrl}
              type="npx"
              onRotateToken={onRotateToken}
              isRotating={isRotating}
              hasValidMcp={hasValidMcp}
            />
          </div>
        );
      case 'cursor':
        return (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">Open Settings:</span> Navigate
                to <strong>Settings</strong> → <strong>Cursor Settings</strong>{' '}
                → <strong>MCP</strong>
              </li>
              <li>
                <span className="font-semibold">Add Server:</span> Click{' '}
                <strong>Add new global MCP server</strong>
              </li>
              <li>
                <span className="font-semibold">Configure:</span> Paste the
                configuration below and save
              </li>
            </ol>
            <ConfigDisplay
              mcpServerUrl={mcpServerUrl}
              type="url"
              onRotateToken={onRotateToken}
              isRotating={isRotating}
              hasValidMcp={hasValidMcp}
            />
          </div>
        );
      case 'windsurf':
        return (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">Open Settings:</span> Use either
                method:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>
                    Go to <strong>Windsurf</strong> → <strong>Settings</strong>{' '}
                    → <strong>Advanced Settings</strong>
                  </li>
                  <li>
                    Open Command Palette and select{' '}
                    <strong>Windsurf Settings Page</strong>
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-semibold">Navigate to Cascade:</span>{' '}
                Select <strong>Cascade</strong> in the sidebar
              </li>
              <li>
                <span className="font-semibold">Add Server:</span> Click{' '}
                <strong>Add Server</strong> →{' '}
                <strong>Add custom server +</strong>
              </li>
              <li>
                <span className="font-semibold">Configure:</span> Paste the
                configuration below and save
              </li>
            </ol>
            <ConfigDisplay
              mcpServerUrl={mcpServerUrl}
              type="url"
              onRotateToken={onRotateToken}
              isRotating={isRotating}
              hasValidMcp={hasValidMcp}
            />
          </div>
        );
      case 'server':
        return (
          <div className="space-y-4">
            <div className="space-y-3 w-full">
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Server URL</h3>
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
                          ? t('Hide the token for security')
                          : t('Show the token')
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
                        'Generate a new token for security. This will invalidate the current URL.',
                      )}
                      onClick={onRotateToken ? onRotateToken : () => {}}
                      variant="outline"
                      className="h-9 w-9"
                      disabled={isRotating || !hasValidMcp}
                      icon={
                        isRotating ? (
                          <ReloadIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="h-4 w-4 text-primary" />
                        )
                      }
                    />
                    <ButtonWithTooltip
                      tooltip={t('Copy URL to clipboard')}
                      onClick={() => {
                        navigator.clipboard.writeText(mcpServerUrl);
                        toast({
                          description: t('URL copied to clipboard'),
                          duration: 3000,
                        });
                      }}
                      variant="outline"
                      className="h-9 w-9"
                      icon={<Copy className="h-4 w-4 text-primary" />}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <p>
                    This URL contains a sensitive security token. Only share it
                    with trusted applications and services. You can rotate the
                    token if you suspect it has been compromised.
                  </p>
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
                Client Setup Instructions
              </h3>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64">
                    <span className="text-sm">
                      After making any changes to connections or flows, you will
                      need to reconnect your MCP server for the changes to take
                      effect.
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
                Follow these instructions to set up MCP in your preferred
                client. Once configured, your AI assistant will be able to
                access your Activepieces tools.
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
                        alt={`${tab.label} icon`}
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
