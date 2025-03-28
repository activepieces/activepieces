import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { SimpleJsonViewer } from '../../../../components/simple-json-viewer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components/ui/tabs';

type McpInstructionProps = {
  mcpServerUrl: string;
};

export const McpInstruction = ({ mcpServerUrl }: McpInstructionProps) => {
  return (
    <div>
      <div className="space-y-4 w-full max-w-[700px]">
        <div>
          <h3 className="font-semibold text-foreground text-base mb-1">
            Client Specific Instructions
          </h3>
          <p className="text-muted-foreground text-sm">
            Follow the instructions below for your specific MCP client
          </p>
        </div>

        <Tabs>
          <TabsList className="gap-3" variant="outline">
            <TabsTrigger value="claude" variant="outline">
              <div className="flex items-center gap-2">
                <img src={claude} alt="Claude icon" className="w-4 h-4" />
                <span>Claude Desktop</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="cursor" variant="outline">
              <div className="flex items-center gap-2">
                <img src={cursor} alt="Cursor icon" className="w-4 h-4" />
                <span>Cursor</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="windsurf" variant="outline">
              <div className="flex items-center gap-2">
                <img src={windsurf} alt="Windsurf icon" className="w-4 h-4" />
                <span>Windsurf</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="claude"
            className="text-muted-foreground mt-3 pl-1 max-w-[700px]"
          >
            <Alert variant="warning" className="mt-4 mb-2">
              <AlertDescription className="text-xs">
                <p>
                  Please note that the Claude Desktop App is different from the one available on the website. 
                </p>
                <p>
                  Download from https://claude.ai/download 
                </p>
              </AlertDescription>
            </Alert>
            <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
              <li>
                <span className="font-semibold">Open</span>{' '}
                <strong>Settings</strong> from the menu in the Claude Desktop App
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
                <span className="font-semibold">Restart</span> Claude Desktop App
              </li>
            </ol>
            <Alert variant="default" className="mt-4 mb-2">
              <AlertDescription className="text-xs">
                <p>
                  <code>mcp-remote</code> connects the Claude Desktop App to our remote
                  server since Claude only supports local connections.
                </p>
                <p className="mt-1">
                  Note: This requires <code>npx</code> to be installed on your
                  system.
                </p>
              </AlertDescription>
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
          </TabsContent>

          <TabsContent value="cursor" className="mt-4 pl-2 max-w-[700px]">
            <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
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
            <div className="mt-4 rounded-md shadow-sm">
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
          </TabsContent>

          <TabsContent
            value="windsurf"
            className="text-muted-foreground mt-3 pl-1 max-w-[700px]"
          >
            <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
              <li>
                <span className="font-semibold">Open settings by either:</span>
                <ul className="list-disc list-inside ml-6 mt-1">
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
            <Alert variant="default" className="mt-4 mb-2">
              <AlertDescription className="text-xs">
                <p>
                  <code>mcp-remote</code> connects Claude Desktop to our remote
                  server since Claude only supports local connections.
                </p>
                <p className="mt-1">
                  Note: This requires <code>npx</code> to be installed on your
                  system.
                </p>
              </AlertDescription>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
