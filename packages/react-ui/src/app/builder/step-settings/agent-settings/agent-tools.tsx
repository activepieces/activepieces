import { Accordion } from '@radix-ui/react-accordion';
import { t } from 'i18next';
import { LucideIcon, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AddToolDropdown } from '@/features/agents/agent-tools/add-agent-tool-dropwdown';
import { AgentMcpToolComponent } from '@/features/agents/agent-tools/componenets/mcp-tool';
import { AgentPieceToolComponent } from '@/features/agents/agent-tools/componenets/piece-tool';
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
  disabled?: boolean;
  label?: string;
  icon?: LucideIcon;
  tools: AgentTool[];
  hideAddButton?: boolean;
  hideBorder?: boolean;
  emptyStateLabel?: string;
  onToolsUpdate: (tools: AgentTool[]) => void;
}

export const AgentTools = ({
  disabled,
  tools,
  label = 'Agent Tools',
  icon: Icon,
  emptyStateLabel = 'Connect apps, MCPs and more.',
  hideAddButton = false,
  hideBorder = false,
  onToolsUpdate,
}: AgentToolsProps) => {

  const removeTool = (toolName: string) => {
    onToolsUpdate(tools.filter((tool) => tool.type !== AgentToolType.MCP && tool.type !== AgentToolType.FLOW_MAKER && toolName !== (tool as AgentPieceTool)?.toolName));
  };

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
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <h2 className="text-sm font-medium">{t(label)}</h2>
      </div>

      <div className="mt-2">
        {tools.length > 0 ? (
          <>
            <Accordion
              type="single"
              collapsible
              className={`rounded-md overflow-hidden shadow-none ${hideBorder ? '' : 'border'}`}
            >
              {Object.entries(pieceToToolMap).map(([pieceName, tools]) => (
                <AgentPieceToolComponent
                  key={pieceName}
                  disabled={disabled}
                  tools={tools}
                  removeTool={removeTool}
                />
              ))}
              {mcpTools.length > 0 && (
                <AgentMcpToolComponent
                  disabled={disabled}
                  tools={mcpTools}
                  removeTool={removeTool}
                />
              )}
            </Accordion>

            {!hideAddButton && (
              <AddToolDropdown disabled={disabled} align="center">
                <Button variant="outline" className="gap-2">
                  <Plus className="size-4" />
                  {t('Add')}
                </Button>
              </AddToolDropdown>
            )}
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center gap-4 rounded-xl bg-card px-4 py-8 text-center ${hideBorder ? '' : 'border'}`}>
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
              {t(emptyStateLabel)}
            </p>
            {!hideAddButton && (
              <AddToolDropdown disabled={disabled} align="center">
                <Button variant="outline" className="gap-2">
                  <Plus className="size-4" />
                  {t('Add')}
                </Button>
              </AddToolDropdown>
            )}
          </div>
        )}
      </div>

      <AgentPieceDialog tools={tools} onToolsUpdate={onToolsUpdate} />
      <AgentMcpDialog tools={tools} onToolsUpdate={onToolsUpdate} />
    </div>
  );
};
