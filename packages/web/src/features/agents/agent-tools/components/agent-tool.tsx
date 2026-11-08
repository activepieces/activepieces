import { AgentAgentTool } from '@activepieces/shared';
import { t } from 'i18next';
import { Bot, Plus, X } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { agentToolsGate } from '../lib/agent-tools-gate';
import { useAgentToolDialogStore } from '../stores/agents-tools';

export const AgentAgentToolComponent = ({
  disabled,
  tools,
  removeTool,
}: AgentAgentToolsAccordionProps) => {
  const { setShowAddAgentDialog } = useAgentToolDialogStore();
  const { agents, complete } = agentToolsGate.useProjectAgents();

  const problemOf = (tool: AgentAgentTool): string | null => {
    if (!complete) {
      return null;
    }
    const target = agents.find(
      (agent) => agent.externalId === tool.externalAgentId,
    );
    if (!target) {
      return t('Deleted');
    }
    return target.isPublished ? null : t('Not published');
  };

  return (
    <AccordionItem value="agents" className="border-b last:border-0">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gray-3 flex items-center justify-center">
            <Bot className="size-4 text-gray-11" />
          </div>
          <span className="text-sm font-medium">{t('Agents')}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const problem = problemOf(tool);
            return (
              <div
                key={tool.toolName}
                className={cn(
                  'group flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-3/50',
                  disabled && 'opacity-50 pointer-events-none',
                  problem && 'border-danger-7',
                )}
              >
                <span className="text-xs font-medium max-w-40 truncate">
                  {tool.agentDisplayName ?? tool.toolName}
                </span>
                {problem && (
                  <span className="text-xs text-danger-11">{problem}</span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={disabled}
                      onClick={() => removeTool(tool.toolName)}
                      variant="ghost"
                      size="icon"
                      className="size-5 p-0.5 text-gray-11 hover:text-danger-11 hover:bg-danger-3 transition"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Remove agent')}</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
        <Button
          variant="link"
          className="mt-4"
          size="xs"
          onClick={() => setShowAddAgentDialog(true)}
        >
          <Plus className="size-3 mr-1" />
          {t('Add Agent')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};

type AgentAgentToolsAccordionProps = {
  disabled?: boolean;
  tools: AgentAgentTool[];
  removeTool: (toolName: string) => void;
};
