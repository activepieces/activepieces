import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';

import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PopulatedFlow } from '@activepieces/shared';

import { CreateMcpFlowButton } from './create-mcp-flow-button';
import { mcpFlowDialogUtils } from './mcp-flow-dialog-utils';

interface McpFlowDialogContentProps {
  flows: PopulatedFlow[];
  selectedFlows: string[];
  setSelectedFlows: (value: string[] | ((prev: string[]) => string[])) => void;
  searchQuery: string;
}

export const McpFlowDialogContent = ({
  flows,
  selectedFlows,
  setSelectedFlows,
  searchQuery,
}: McpFlowDialogContentProps) => {
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const filteredFlows = useMemo(() => {
    if (!debouncedQuery) return flows;

    const query = debouncedQuery.toLowerCase();
    return flows.filter((flow) =>
      flow.version.displayName.toLowerCase().includes(query),
    );
  }, [flows, debouncedQuery]);

  const handleSelectFlow = (flowId: string) => {
    setSelectedFlows((prev: string[]) => {
      const newSelected = prev.includes(flowId)
        ? prev.filter((id: string) => id !== flowId)
        : [...prev, flowId];
      return newSelected;
    });
  };

  return (
    <ScrollArea className="flex-grow overflow-y-auto rounded-md">
      <div className="grid grid-cols-4 gap-4">
        <CreateMcpFlowButton />

        {filteredFlows.map((flow) => {
          const tooltip = mcpFlowDialogUtils.getFlowTooltip(flow);
          const isSelectable = mcpFlowDialogUtils.isFlowSelectable(flow);

          return (
            <Tooltip key={flow.id}>
              <TooltipTrigger asChild>
                <div
                  className={`border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg relative ${
                    !isSelectable ? 'opacity-50' : ''
                  } ${selectedFlows.includes(flow.id) ? 'bg-accent' : ''}`}
                  onClick={() => isSelectable && handleSelectFlow(flow.id)}
                >
                  <Checkbox
                    checked={selectedFlows.includes(flow.id)}
                    onCheckedChange={() =>
                      isSelectable && handleSelectFlow(flow.id)
                    }
                    className="absolute top-2 left-2"
                    onClick={(e) => e.stopPropagation()}
                    disabled={!isSelectable}
                  />

                  <Workflow className="w-[40px] h-[40px] text-muted-foreground" />
                  <div className="w-full mt-2 text-center text-md px-2 text-ellipsis overflow-hidden">
                    {flow.version.displayName}
                  </div>
                </div>
              </TooltipTrigger>
              {tooltip && (
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>

      {filteredFlows.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          {searchQuery ? t('No flows found') : t('No flows available')}
        </div>
      )}
    </ScrollArea>
  );
};
