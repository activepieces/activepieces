import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Workflow, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  PieceStepMetadataWithSuggestions,
  StepMetadata,
} from '@/features/pieces/lib/types';
import { authenticationSession } from '@/lib/authentication-session';
import {
  assertNotNullOrUndefined,
  FlowOperationType,
  Trigger,
  PopulatedFlow,
  FlowOperationRequest,
  FlowVersionState,
} from '@activepieces/shared';

interface McpFlowActionsDialogProps {
  flows: PopulatedFlow[];
  selectedFlows: string[];
  setSelectedFlows: (value: string[] | ((prev: string[]) => string[])) => void;
  searchQuery: string;
}

export const McpFlowActionsDialog = ({
  flows,
  selectedFlows,
  setSelectedFlows,
  searchQuery,
}: McpFlowActionsDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const { metadata } = piecesHooks.useAllStepsMetadata({
    searchQuery: 'mcp',
    type: 'trigger',
  });

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

  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: t('Untitled'),
      });
      return flow;
    },
    onSuccess: async (flow) => {
      const triggerMetadata = metadata?.find(
        (m) =>
          (m as PieceStepMetadataWithSuggestions).pieceName ===
          '@activepieces/piece-mcp',
      );

      const trigger = (
        triggerMetadata as PieceStepMetadataWithSuggestions
      )?.suggestedTriggers?.find((t: any) => t.name === 'mcp_tool');

      assertNotNullOrUndefined(trigger, 'Trigger not found');

      const stepData = pieceSelectorUtils.getDefaultStep({
        stepName: 'trigger',
        stepMetadata: triggerMetadata as StepMetadata,
        actionOrTrigger: trigger,
      });

      await applyOperation(flow, {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: stepData as Trigger,
      });

      toast({
        description: t('Flow created successfully'),
        duration: 3000,
      });
      navigate(`/flows/${flow.id}`);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to create flow'),
        duration: 5000,
      });
    },
  });

  const applyOperation = async (
    flow: PopulatedFlow,
    operation: FlowOperationRequest,
  ) => {
    try {
      const updatedFlowVersion = await flowsApi.update(
        flow.id,
        operation,
        true,
      );
      return {
        flowVersion: {
          ...flow.version,
          id: updatedFlowVersion.version.id,
          state: updatedFlowVersion.version.state,
        },
      };
    } catch (error) {
      console.error(error);
    }
  };

  const isFlowSelectable = (flow: PopulatedFlow) => {
    return (
      flow.version.state === FlowVersionState.LOCKED &&
      flow.status === 'ENABLED'
    );
  };

  const getFlowTooltip = (flow: PopulatedFlow) => {
    if (flow.version.state !== FlowVersionState.LOCKED) {
      return t('Flow must be published to be selected');
    }
    if (flow.status !== 'ENABLED') {
      return t('Flow must be enabled to be selected');
    }
    return '';
  };

  return (
    <ScrollArea className="flex-grow overflow-y-auto rounded-md">
      <div className="grid grid-cols-4 gap-4">
        <div
          onClick={() => createFlow()}
          className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg border-dashed border-muted-foreground/50"
        >
          <Plus className="w-[40px] h-[40px] text-muted-foreground" />
          <div className="mt-2 text-center text-md">
            {isCreateFlowPending ? t('Creating...') : t('Create New Flow')}
          </div>
        </div>

        {filteredFlows.map((flow) => {
          const tooltip = getFlowTooltip(flow);
          const isSelectable = isFlowSelectable(flow);

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

                  <div className="mt-2 text-center text-md px-2 line-clamp-2">
                    {flow.version.displayName}
                  </div>

                  {flow.status && (
                    <span
                      className={`absolute top-2 right-2 text-xs rounded-full`}
                    >
                      <Badge
                        variant="outline"
                        className={`${
                          flow.status === 'ENABLED'
                            ? 'bg-success/20 text-success'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {flow.status === 'ENABLED'
                          ? t('Enabled')
                          : t('Disabled')}
                      </Badge>
                    </span>
                  )}
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
