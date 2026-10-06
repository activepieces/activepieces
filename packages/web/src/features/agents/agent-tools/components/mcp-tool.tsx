import { AgentMcpTool } from '@activepieces/shared';
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { McpSvg } from '@/assets/img/custom/mcp';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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

import { useMcpToolDialogStore } from '../stores/mcp-tools';

type AgentMcpToolsAccordionProps = {
  disabled?: boolean;
  tools: AgentMcpTool[];
  removeTool: (toolName: string) => void;
};

export const AgentMcpToolComponent = ({
  disabled,
  tools,
  removeTool,
}: AgentMcpToolsAccordionProps) => {
  const { setShowAddMcpDialog } = useMcpToolDialogStore();

  return (
    <AccordionItem value="mcp" className="border-b last:border-0">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gray-3 flex items-center justify-center">
            <McpSvg className="size-3.5" />
          </div>
          <span className="text-sm font-medium">{t('MCP Servers')}</span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <div
              key={tool.toolName}
              onClick={() => setShowAddMcpDialog(true, tool)}
              className={`
                group flex items-center gap-2 px-3 py-1 cursor-pointer
                rounded-full border bg-gray-3/50
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <span className="text-xs font-medium max-w-40 truncate">
                {tool.toolName}
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTool(tool.toolName);
                    }}
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
                    <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Remove MCP server')}</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        <Button
          variant="link"
          className="mt-4"
          size="xs"
          onClick={() => setShowAddMcpDialog(true)}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3 mr-1" />
          {t('Add MCP Server')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};
