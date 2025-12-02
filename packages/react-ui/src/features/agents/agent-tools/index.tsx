import { t } from 'i18next';
import { ControllerRenderProps } from 'react-hook-form';

import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import type { AgentTool } from '@activepieces/shared';
import { AgentToolType } from '@activepieces/shared';

import { AddAgentToolDropdown } from './add-agent-tool-dropwdown';
import { AgentFlowTool } from './flow-tool';
import { AgentPieceTool } from './piece-tool';

interface AgentToolsProps {
  agentToolsField: ControllerRenderProps;
  disabled?: boolean;
}

export const AgentTools = ({ disabled, agentToolsField }: AgentToolsProps) => {
  const tools = Array.isArray(agentToolsField.value)
    ? (agentToolsField.value as AgentTool[])
    : [];

  const onToolsUpdate = (tools: AgentTool[]) => agentToolsField.onChange(tools);

  const { pieces } = piecesHooks.usePieces({});

  const removeTool = async (toolIds: string[]): Promise<void> => {
    const newTools = tools.filter((tool) => !toolIds.includes(tool.toolName));

    onToolsUpdate(newTools);
  };

  const piecesCount =
    tools.filter((tool) => tool.type === AgentToolType.PIECE).length || 0;

  const flowsCount =
    tools.filter((tool) => tool.type === AgentToolType.FLOW).length || 0;

  const totalToolsCount = piecesCount + flowsCount;
  const hasTools = totalToolsCount > 0;
  const pieceToToolMap = tools.reduce((acc, tool) => {
    const key =
      tool.type === AgentToolType.PIECE
        ? tool.pieceMetadata?.pieceName
        : tool.flowId;

    if (key) {
      acc[key] = acc[key] || [];
      acc[key].push(tool);
    }

    return acc;
  }, {} as Record<string, AgentTool[]>);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="space-y-0">
          <h2 className="text-sm flex font-medium items-center gap-2">
            {t('Tools')}
          </h2>
        </div>
        <div className="flex gap-2">
          <AddAgentToolDropdown
            disabled={disabled}
            onToolsUpdate={(tools) => {
              onToolsUpdate?.(tools);
            }}
            tools={tools}
          />
        </div>
      </div>

      <div className="mt-2">
        {hasTools && (
          <ScrollArea>
            <div className="space-y-2">
              {pieceToToolMap &&
                Object.entries(pieceToToolMap).map(([toolKey, tools]) => {
                  if (tools[0].type === AgentToolType.PIECE) {
                    return (
                      <AgentPieceTool
                        disabled={disabled}
                        key={toolKey}
                        tools={tools}
                        pieces={pieces || []}
                        removeTool={removeTool}
                      />
                    );
                  } else if (tools[0].type === AgentToolType.FLOW) {
                    return (
                      <AgentFlowTool
                        disabled={disabled}
                        key={toolKey}
                        tool={tools[0]}
                        removeTool={removeTool}
                      />
                    );
                  }
                  return null;
                })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
