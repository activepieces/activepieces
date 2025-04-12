import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Link,
  Server,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
} from 'lucide-react';
import { useState } from 'react';

import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
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

export const McpClientTabs = ({
  mcpServerUrl,
  hasTools = false,
  onRotateToken,
  isRotating = false,
  hasValidMcp = false,
}: McpClientTabsProps) => {
  const [activeTab, setActiveTab] = useState('claude');
  const [isExpanded, setIsExpanded] = useState(!hasTools);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const toggleTokenVisibility = () => {
    setShowToken(!showToken);
  };

  const maskedServerUrl = showToken
    ? mcpServerUrl
    : mcpServerUrl.replace(/\/([^/]+)\/sse$/, '/••••••••••••••••••••••/sse');

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
              <AlertDescription className="text-xs">
                <p>
                  Note: MCPs currently only work with Claude Desktop, not the
                  web version.
                </p>
                <p>You can download it from: https://claude.ai/download</p>
              </AlertDescription>
            </Alert>
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">Open</span>{' '}
                <strong>Settings</strong> from the menu in the Claude Desktop
                App
              </li>
              <li>
                <span className="font-semibold">Select</span>{' '}
                <strong>Developer</strong>
              </li>
              <li>
                <span className="font-semibold">Click</span>{' '}
                <strong>Edit Config</strong>
              </li>
              <li>
                <span className="font-semibold">Copy and paste</span> the server
                config to your claude_desktop_config, then save
              </li>
              <li>
                <span className="font-semibold">Restart</span> Claude Desktop
                App
              </li>
            </ol>
            <Alert variant="default" className="mb-4 bg-muted/40">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <AlertDescription className="text-xs">
                  <p>
                    <code>mcp-remote</code> connects the Claude Desktop App to
                    our remote server since Claude only supports local
                    connections.
                  </p>
                  <p className="mt-1">
                    Note: This requires <code>npx</code> to be installed on your
                    system.
                  </p>
                </AlertDescription>
              </div>
            </Alert>
            <div className="rounded-md shadow-sm">
              <SimpleJsonViewer
                data={{
                  mcpServers: {
                    Activepieces: {
                      command: 'npx',
                      args: ['-y', 'mcp-remote', mcpServerUrl],
                    },
                  },
                }}
                title="MCP Server Configuration"
              />
            </div>
          </div>
        );
      case 'cursor':
        return (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">Navigate to</span>{' '}
                <strong>Settings</strong>, then <strong>Cursor Settings</strong>
              </li>
              <li>
                <span className="font-semibold">Select</span>{' '}
                <strong>MCP</strong> on the left
              </li>
              <li>
                <span className="font-semibold">Click</span>{' '}
                <strong>Add new global MCP server</strong> at the top right
              </li>
              <li>
                <span className="font-semibold">Copy and paste</span> the server
                config to your existing file, then save
              </li>
            </ol>
            <div className="rounded-md shadow-sm">
              <SimpleJsonViewer
                data={{
                  mcpServers: {
                    Activepieces: {
                      url: mcpServerUrl,
                    },
                  },
                }}
                title="MCP Server Configuration"
              />
            </div>
          </div>
        );
      case 'windsurf':
        return (
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-foreground mb-4">
              <li>
                <span className="font-semibold">Open settings by either:</span>
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li>
                    Navigating to <strong>Windsurf - Settings</strong>, then{' '}
                    <strong>Advanced Settings</strong>
                  </li>
                  <li>
                    Opening the <strong>Command Palette</strong> and selecting{' '}
                    <strong>Windsurf Settings Page</strong>
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-semibold">Select</span>{' '}
                <strong>Cascade</strong> on the left
              </li>
              <li>
                <span className="font-semibold">Click</span>{' '}
                <strong>Add Server</strong> at the top right
              </li>
              <li>
                <span className="font-semibold">Click</span>{' '}
                <strong>Add custom server +</strong> at the top right
              </li>
              <li>
                <span className="font-semibold">Copy and paste</span> the server
                config to your existing file, then save
              </li>
            </ol>
            <Alert variant="default" className="mb-4 bg-muted/40">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <AlertDescription className="text-xs">
                  <p>
                    <code>mcp-remote</code> connects Claude Desktop to our
                    remote server since Claude only supports local connections.
                  </p>
                  <p className="mt-1">
                    Note: This requires <code>npx</code> to be installed on your
                    system.
                  </p>
                </AlertDescription>
              </div>
            </Alert>
            <div className="rounded-md shadow-sm">
              <SimpleJsonViewer
                data={{
                  mcpServers: {
                    Activepieces: {
                      command: 'npx',
                      args: ['-y', 'mcp-remote', mcpServerUrl],
                    },
                  },
                }}
                title="MCP Server Configuration"
              />
            </div>
          </div>
        );
      case 'server':
        return (
          <div className="space-y-4">
            <div className="space-y-3 w-full">
              <div className="flex items-center gap-2 mb-1">
                <Link className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Server URL</h3>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="font-mono bg-muted/30 text-foreground/90 cursor-text w-full border rounded-md px-3 py-2.5 text-sm overflow-x-auto">
                    {maskedServerUrl}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={toggleTokenVisibility}
                          >
                            {showToken ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {showToken
                              ? t('Hide the token for security')
                              : t('Show the token')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 text-amber-500"
                            onClick={onRotateToken}
                            disabled={isRotating || !hasValidMcp}
                          >
                            {isRotating ? (
                              <ReloadIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <KeyRound className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {t(
                              'Generate a new token for security. This will invalidate the current URL.',
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 text-blue-500"
                            onClick={() => {
                              navigator.clipboard.writeText(mcpServerUrl);
                              toast({
                                description: t('URL copied to clipboard'),
                                duration: 3000,
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('Copy URL to clipboard')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    This URL contains a sensitive security token. Only share it
                    with trusted applications and services. You can rotate the
                    token if you suspect it has been compromised.
                  </p>
                </div>
                <Alert variant="warning" className="mt-2">
                  <AlertDescription>
                    After making any changes to connections or flows, you will
                    need to reconnect your MCP server for the changes to take
                    effect.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-8 border-border">
      <CardContent className="p-5 pt-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
                    <p className="text-xs">
                      After making any changes to connections or flows, you will
                      need to reconnect your MCP server for the changes to take
                      effect.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Expand
                </>
              )}
            </Button>
          </div>

          <p className="text-muted-foreground text-sm ml-7">
            Follow these instructions to set up MCP in your preferred client.
            Once configured, your AI assistant will be able to access your
            Activepieces tools.
          </p>

          {isExpanded && (
            <>
              <div className="flex flex-wrap gap-2 mb-4 mt-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setActiveTab(tab.id)}
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

              <div className="p-1">{renderTabContent()}</div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
