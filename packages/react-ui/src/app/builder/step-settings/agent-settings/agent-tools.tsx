import { Accordion } from '@radix-ui/react-accordion';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { ControllerRenderProps } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { AddToolDropdown } from '@/features/agents/agent-tools/add-agent-tool-dropwdown';
import { AgentFlowToolComponent } from '@/features/agents/agent-tools/componenets/flow-tool';
import { AgentMcpToolComponent } from '@/features/agents/agent-tools/componenets/mcp-tool';
import { AgentPieceToolComponent } from '@/features/agents/agent-tools/componenets/piece-tool';
import { AgentFlowToolDialog } from '@/features/agents/agent-tools/flow-tool-dialog';
import { AgentMcpDialog } from '@/features/agents/agent-tools/mcp-tool-dialog';
import { AgentToolType } from '@activepieces/shared';
import type { AgentPieceTool, AgentTool } from '@activepieces/shared';

import { AgentPieceDialog } from './piece-tool-dialog';

const icons = [
  'https://cdn.activepieces.com/pieces/youtube.png',
  'https://cdn.activepieces.com/pieces/slack.png',
  'https://cdn.activepieces.com/pieces/github.png',
  'https://cdn.activepieces.com/pieces/notion.png',
];

interface AgentToolsProps {
  toolsField: ControllerRenderProps;
  disabled?: boolean;
}

export const AgentTools = ({
  disabled,
  toolsField: agentToolsField,
}: AgentToolsProps) => {
  const tools = Array.isArray(agentToolsField.value)
    ? (agentToolsField.value as AgentTool[])
    : [];

  const onToolsUpdate = (tools: AgentTool[]) => agentToolsField.onChange(tools);

  const removeTool = (toolName: string) => {
    onToolsUpdate(tools.filter((tool) => toolName !== tool.toolName));
  };

  const flowTools = tools.filter((tool) => tool.type === AgentToolType.FLOW);
  const mcpTools = tools.filter((tool) => tool.type === AgentToolType.MCP);
  const pieceToToolMap = tools
    .filter((tool) => tool.type === AgentToolType.PIECE)
    .reduce<Record<string, AgentPieceTool[]>>((acc, tool) => {
      const key = tool.pieceMetadata?.pieceName;

      if (!key) return acc;

      (acc[key] ??= []).push(tool);
      return acc;
    }, {});

  return (
    <div>
      <h2 className="text-sm font-medium">{t('Agent Tools')}</h2>

      <div className="mt-2">
        {tools.length > 0 ? (
          <>
            <Accordion
              type="single"
              collapsible
              className="border rounded-md overflow-hidden shadow-none"
            >
              {Object.entries(pieceToToolMap).map(([pieceName, tools]) => (
                <AgentPieceToolComponent
                  key={pieceName}
                  disabled={disabled}
                  tools={tools}
                  removeTool={removeTool}
                />
              ))}
              {flowTools.length > 0 && (
                <AgentFlowToolComponent
                  disabled={disabled}
                  tools={flowTools}
                  removeTool={removeTool}
                />
              )}
              {mcpTools.length > 0 && (
                <AgentMcpToolComponent
                  disabled={disabled}
                  tools={mcpTools}
                  removeTool={removeTool}
                />
              )}
            </Accordion>
            <AddToolDropdown disabled={disabled} align="start">
              <Button variant="outline" className="mt-2">
                <Plus className="size-4 mr-2" />
                {t('Add')}
              </Button>
            </AddToolDropdown>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-4 py-8 text-center">
            <div className="flex items-center">
              {icons.slice(0, 4).map((icon, index) => (
                <div
                  key={icon}
                  className="relative flex size-9 items-center justify-center rounded-full border bg-background"
                  style={{ marginLeft: index === 0 ? 0 : -10 }}
                >
                  <img
                    src={icon}
                    alt={icon}
                    className="size-4 object-contain"
                  />
                </div>
              ))}
              <div
                className="relative flex size-9 items-center justify-center rounded-full border text-[10px] bg-background text-foreground font-medium"
                style={{ marginLeft: -10 }}
              >
                <span>+500</span>
              </div>
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {t('Connect apps, flows, MCPs and more.')}
            </p>

            <AddToolDropdown disabled={disabled} align="center">
              <Button variant="outline" className="gap-2">
                <Plus className="size-4" />
                {t('Add')}
              </Button>
            </AddToolDropdown>
          </div>
        )}
      </div>

      <AgentFlowToolDialog onToolsUpdate={onToolsUpdate} tools={tools} />
      <AgentPieceDialog tools={tools} onToolsUpdate={onToolsUpdate} />
      <AgentMcpDialog tools={tools} onToolsUpdate={onToolsUpdate} />
    </div>
  );
};
