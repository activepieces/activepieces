import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';

import { Checkbox } from '@/components/ui/checkbox';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import {
  AgentFlowTool,
  AgentToolType,
  PopulatedFlow,
} from '@activepieces/shared';

import { CreateMcpFlowButton } from './create-mcp-flow-button';
import { flowDialogUtils } from './flow-dialog-utils';

interface FlowDialogContentProps {
  flows: PopulatedFlow[];
  selectedFlows: AgentFlowTool[];
  setSelectedFlows: (
    value: AgentFlowTool[] | ((prev: AgentFlowTool[]) => AgentFlowTool[]),
  ) => void;
  searchQuery: string;
}

export const FlowDialogContent = ({
  flows,
  selectedFlows,
  setSelectedFlows,
  searchQuery,
}: FlowDialogContentProps) => {
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const filteredFlows = useMemo(() => {
    if (!debouncedQuery) return flows;

    const query = debouncedQuery.toLowerCase();
    return flows.filter((flow) =>
      flow.version.displayName.toLowerCase().includes(query),
    );
  }, [flows, debouncedQuery]);

  const isSelected = (flow: PopulatedFlow) =>
    selectedFlows.some((tool) => tool.externalFlowId === flow.externalId);

  const toggleFlow = (flow: PopulatedFlow) => {
    setSelectedFlows((prev) => {
      const exists = prev.some(
        (tool) => tool.externalFlowId === flow.externalId,
      );

      if (exists) {
        return prev.filter((tool) => tool.externalFlowId !== flow.externalId);
      }

      return [
        ...prev,
        {
          externalFlowId: flow.externalId,
          toolName: `${flow.version.displayName}_${flow.id}`,
          type: AgentToolType.FLOW,
        },
      ];
    });
  };

  return (
    <>
      <div className="flex flex-col px-4 py-2">
        {filteredFlows.map((flow, index) => {
          const helperText = flowDialogUtils.getFlowTooltip(flow);
          const isSelectable = flowDialogUtils.isFlowSelectable(flow);
          const selected = isSelected(flow);

          return (
            <div key={flow.id}>
              <div
                className={`
                  flex items-center gap-4 px-4 py-2 h-14 rounded-md cursor-pointer
                  hover:bg-accent hover:text-accent-foreground
                  ${selected ? 'bg-accent' : ''}
                  ${!isSelectable ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => isSelectable && toggleFlow(flow)}
              >
                <Checkbox
                  checked={selected}
                  disabled={!isSelectable}
                  onCheckedChange={() => isSelectable && toggleFlow(flow)}
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {flow.version.displayName}
                  </div>

                  {helperText && (
                    <div className="text-xs text-muted-foreground truncate">
                      {helperText}
                    </div>
                  )}
                </div>

                <PieceIconList
                  trigger={flow.version.trigger}
                  maxNumberOfIconsToShow={3}
                />
              </div>

              {index < filteredFlows.length - 1 && (
                <div className="h-px bg-border my-1" />
              )}
            </div>
          );
        })}
      </div>

      {filteredFlows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-muted/40">
            <Workflow className="size-7 text-muted-foreground" />
          </div>

          <div className="text-base font-semibold text-foreground">
            {t('No flows found')}
          </div>

          <div className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {searchQuery
              ? t('Try adjusting your search or create a new flow.')
              : t('Create a flow to use it as a tool in your agent.')}
          </div>

          {!searchQuery && (
            <div className="mt-6">
              <CreateMcpFlowButton />
            </div>
          )}
        </div>
      )}
    </>
  );
};
