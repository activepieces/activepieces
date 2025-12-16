import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { ControllerRenderProps } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import type {
  AgentPieceTool,
  AgentTool,
} from '@activepieces/shared';
import { AgentToolType } from '@activepieces/shared';

import { AddToolDropdown } from './add-agent-tool-dropwdown';
import { AgentFlowToolComponent } from './componenets/flow-tool';
import { AgentPieceToolComponent } from './componenets/piece-tool';
import { AgentFlowToolDialog } from './flow-tool-dialog';
import { AgentPieceDialog } from './piece-tool-dialog';
import { useAgentToolsStore } from './store';

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
  const { showAddFlowDialog, setShowAddFlowDialog, openPieceDialog } =
    useAgentToolsStore();

  const tools = Array.isArray(agentToolsField.value)
    ? (agentToolsField.value as AgentTool[])
    : [];

  const onToolsUpdate = (tools: AgentTool[]) => agentToolsField.onChange(tools);

  const { pieces } = piecesHooks.usePieces({});

  const removeTool = (toolName: string) => {
    onToolsUpdate(tools.filter((tool) => toolName !== tool.toolName));
  };

  const handleOpenAddPieceDialog = () => {
    openPieceDialog('pieces-list');
  };

  const flowTools = tools.filter((tool) => tool.type === AgentToolType.FLOW);
  const pieceToToolMap = tools
    .filter((tool) => tool.type === AgentToolType.PIECE)
    .reduce<Record<string, AgentPieceTool[]>>((acc, tool) => {
      const key = tool.pieceMetadata?.pieceName;

      if (!key) return acc;

      (acc[key] ??= []).push(tool);
      return acc;
    }, {});

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{t('Tools')}</h2>

        <AddToolDropdown
          disabled={disabled}
          setShowAddFlowDialog={setShowAddFlowDialog}
          setShowAddPieceDialog={handleOpenAddPieceDialog}
          align="end"
        >
          <Button variant="ghost" size="icon">
            <Plus className="size-4" />
          </Button>
        </AddToolDropdown>
      </div>

      <div className="mt-2">
        {tools.length > 0 ? (
          <ScrollArea>
            <div className="space-y-2">
              {Object.entries(pieceToToolMap).map(([pieceName, tools]) => (
                <AgentPieceToolComponent
                  key={pieceName}
                  disabled={disabled}
                  tools={tools}
                  pieces={pieces || []}
                  removeTool={removeTool}
                />
              ))}
              {flowTools.map((tool) => (
                <AgentFlowToolComponent
                  key={tool.flowId}
                  disabled={disabled}
                  tool={tool}
                  removeTool={removeTool}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-4 py-8 text-center">
            <div className="flex items-center gap-2">
              {icons.slice(0, 4).map((icon) => (
                <div
                  key={icon}
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-background"
                >
                  <img
                    src={icon}
                    alt={icon}
                    className="size-4 object-contain"
                  />
                </div>
              ))}
            </div>

            <p className="text-sm font-medium text-muted-foreground">
              {t('Your agent have no tools yet !')}
            </p>

            <AddToolDropdown
              disabled={disabled}
              setShowAddFlowDialog={setShowAddFlowDialog}
              setShowAddPieceDialog={handleOpenAddPieceDialog}
              align="center"
            >
              <Button variant="accent" className="gap-2">
                <Plus className="size-4" />
                {t('Add Tool')}
              </Button>
            </AddToolDropdown>
          </div>
        )}
      </div>

      <AgentFlowToolDialog
        open={showAddFlowDialog}
        selectedFlows={tools
          .filter((tool) => tool.type === AgentToolType.FLOW)
          .map((tool) => tool.flowId!)}
        onToolsUpdate={(newTools) => {
          onToolsUpdate(newTools);
          setShowAddFlowDialog(false);
        }}
        onClose={() => {
          setShowAddFlowDialog(false);
        }}
        tools={tools}
      />

      <AgentPieceDialog tools={tools} onToolsUpdate={onToolsUpdate} />
    </div>
  );
};
