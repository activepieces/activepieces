import { Info, Zap } from 'lucide-react';

import claude from '@/assets/img/custom/claude.svg';
import cursor from '@/assets/img/custom/cursor.svg';
import windsurf from '@/assets/img/custom/windsurf.svg';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { SimpleJsonViewer } from '../../../components/simple-json-viewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';

type McpInstructionProps = {
  mcpServerUrl: string;
};

export const McpInstruction = ({ mcpServerUrl }: McpInstructionProps) => {
  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">
            Client Specific Instructions
          </h3>
        </div>
        <p className="text-muted-foreground text-sm pl-7">
          Follow these instructions to set up MCP in your preferred client. Once
          configured, your AI assistant will be able to access your Activepieces
          tools.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="claude"
          className="border border-border rounded-lg mb-3 px-4 "
        >
          <AccordionTrigger className="py-3">
            <div className="flex items-center gap-2">
              <img src={claude} alt="Claude icon" className="w-5 h-5" />
              <span className="font-medium">Claude Desktop</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground px-1">
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="cursor"
          className="border border-border rounded-lg mb-3 px-4"
        >
          <AccordionTrigger className="py-3">
            <div className="flex items-center gap-2">
              <img src={cursor} alt="Cursor icon" className="w-5 h-5" />
              <span className="font-medium">Cursor</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground px-1">
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="windsurf"
          className="border border-border rounded-lg mb-3 px-4"
        >
          <AccordionTrigger className="py-3">
            <div className="flex items-center gap-2">
              <img src={windsurf} alt="Windsurf icon" className="w-5 h-5" />
              <span className="font-medium">Windsurf</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground px-1">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
