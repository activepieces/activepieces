import { AgentFlowTool } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, Workflow, X } from 'lucide-react';

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

import { useFlowToolDialogStore } from '../stores/flows-tools';

type AgentFlowToolsAccordionProps = {
  disabled?: boolean;
  tools: AgentFlowTool[];
  removeTool: (toolName: string) => void;
};

export const AgentFlowToolComponent = ({
  disabled,
  tools,
  removeTool,
}: AgentFlowToolsAccordionProps) => {
  const { setShowAddFlowDialog } = useFlowToolDialogStore();

  return (
    <AccordionItem value="flows" className="border-b last:border-0">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gray-3 flex items-center justify-center">
            <Workflow className="size-4 text-gray-11" />
          </div>
          <span className="text-sm font-medium">{t('Flows')}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <div
              key={tool.toolName}
              className={`
                group flex items-center gap-2 px-3 py-1
                rounded-full border bg-gray-3/50
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <span className="text-sm font-medium max-w-40 truncate">
                {tool.flowDisplayName ?? tool.toolName ?? t('Flow')}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    onClick={() => removeTool(tool.toolName)}
                    variant="ghost"
                    size="icon"
                    className="
                      size-5 p-0.5
                      text-gray-11
                      hover:text-danger-11
                      hover:bg-danger-3
                      transition
                    "
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Remove flow')}</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
        <Button
          variant="link"
          className="mt-4"
          size="xs"
          onClick={() => setShowAddFlowDialog(true)}
        >
          <Plus className="size-3 mr-1" />
          {t('Add flow')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};
