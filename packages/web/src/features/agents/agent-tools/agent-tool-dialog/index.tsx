import {
  AgentAgentTool,
  AgentSummary,
  AgentTool,
  AgentToolType,
  AgentVisibility,
  mcpToolNameUtils,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { agentToolsGate } from '../lib/agent-tools-gate';
import { useAgentToolDialogStore } from '../stores/agents-tools';

export function AgentAgentToolDialog({
  tools,
  onToolsUpdate,
  ownerExternalId,
}: AgentAgentToolDialogProps) {
  const { showAddAgentDialog, setShowAddAgentDialog } =
    useAgentToolDialogStore();

  return (
    <Dialog open={showAddAgentDialog} onOpenChange={setShowAddAgentDialog}>
      <AgentToolDialogContent
        key={`agent-dialog-${showAddAgentDialog}`}
        tools={tools}
        onToolsUpdate={onToolsUpdate}
        ownerExternalId={ownerExternalId}
      />
    </Dialog>
  );
}

function AgentToolDialogContent({
  tools,
  onToolsUpdate,
  ownerExternalId,
}: AgentAgentToolDialogProps) {
  const [selected, setSelected] = useState<AgentAgentTool[]>(
    tools.filter(
      (tool): tool is AgentAgentTool => tool.type === AgentToolType.AGENT,
    ),
  );
  const { setShowAddAgentDialog } = useAgentToolDialogStore();
  const { agents } = agentToolsGate.useProjectAgents();
  const candidates = agents.filter(
    (agent) =>
      agent.isPublished &&
      agent.visibility === AgentVisibility.PROJECT &&
      agent.externalId !== ownerExternalId,
  );

  const isSelected = (agent: AgentSummary) =>
    selected.some((tool) => tool.externalAgentId === agent.externalId);

  const toggle = (agent: AgentSummary) =>
    setSelected((prev) =>
      isSelected(agent)
        ? prev.filter((tool) => tool.externalAgentId !== agent.externalId)
        : [
            ...prev,
            {
              type: AgentToolType.AGENT,
              toolName: mcpToolNameUtils.uniqueToolName({
                sourceName: agent.displayName,
                taken: [...tools, ...prev].map((tool) => tool.toolName),
              }),
              externalAgentId: agent.externalId,
              agentDisplayName: agent.displayName,
            },
          ],
    );

  const handleSave = () => {
    const otherTools = tools.filter(
      (tool) => tool.type !== AgentToolType.AGENT,
    );
    onToolsUpdate([...otherTools, ...selected]);
    setShowAddAgentDialog(false);
  };

  return (
    <DialogContent className="w-[90vw] max-w-[600px] h-[70vh] max-h-[700px] flex flex-col overflow-hidden p-0">
      <DialogHeader className="min-h-16 flex px-4 items-start justify-center mb-0 border-b">
        <DialogTitle>{t('Add Agent Tools')}</DialogTitle>
      </DialogHeader>

      <ScrollArea className="grow overflow-y-auto">
        <div className="flex flex-col px-4 py-2">
          {candidates.length === 0 && (
            <p className="text-sm text-gray-11 py-6">
              {t('Publish another agent in this project to use it here.')}
            </p>
          )}
          {candidates.map((agent) => {
            const nested = agent.toolTypes.includes(AgentToolType.AGENT);
            return (
              <label
                key={agent.externalId}
                className={cn(
                  'flex items-center gap-4 px-4 py-2 min-h-14 rounded-md',
                  nested
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-gray-4',
                  isSelected(agent) && 'bg-gray-4',
                )}
              >
                <Checkbox
                  checked={isSelected(agent)}
                  disabled={nested}
                  onCheckedChange={() => toggle(agent)}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {agent.displayName}
                  </div>
                  <div className="text-xs text-gray-11 truncate">
                    {nested
                      ? t('Already calls other agents, so it cannot be called')
                      : agent.description ?? ''}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </ScrollArea>

      <DialogFooter className="border-t p-4 mt-auto">
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {t('Close')}
          </Button>
        </DialogClose>
        <Button type="button" onClick={handleSave}>
          {t('Save')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

type AgentAgentToolDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
  ownerExternalId?: string;
};
