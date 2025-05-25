import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Workflow, Plus, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { Button } from '@/components/ui/button';
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

  const allSelected =
    flows.length > 0 && flows.every((flow) => selectedFlows.includes(flow.id));
  const someSelected =
    flows.length > 0 &&
    !allSelected &&
    flows.some((flow) => selectedFlows.includes(flow.id));

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFlows(flows.map((flow) => flow.id));
    } else {
      setSelectedFlows([]);
    }
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
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={
                allSelected ? true : someSelected ? 'indeterminate' : false
              }
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <span className="text-sm font-bold select-none">
              {t('Select all')}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createFlow()}
            disabled={isCreateFlowPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Create New Flow')}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow overflow-y-auto rounded-md mt-4">
        <div className="flex flex-col gap-2">
          {filteredFlows.map((flow) => {
            const tooltip = getFlowTooltip(flow);
            const isSelectable = isFlowSelectable(flow);

            return (
              <Tooltip key={flow.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-start gap-4 rounded-md px-3 py-2 hover:bg-accent cursor-pointer ${
                      !isSelectable ? 'opacity-50' : ''
                    }`}
                    onClick={() => isSelectable && handleSelectFlow(flow.id)}
                  >
                    <Checkbox
                      checked={selectedFlows.includes(flow.id)}
                      onCheckedChange={() =>
                        isSelectable && handleSelectFlow(flow.id)
                      }
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                      disabled={!isSelectable}
                    />
                    <div className="flex gap-2 items-center">
                      <Workflow className="w-5 h-5 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {flow.version.displayName}
                          </span>
                          {flow.status && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                flow.status === 'ENABLED'
                                  ? 'bg-success/20 text-success'
                                  : 'bg-destructive/20 text-destructive'
                              }`}
                            >
                              {flow.status}
                            </span>
                          )}
                          {!isSelectable && (
                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
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
          {filteredFlows.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? t('No flows found') : t('No flows available')}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};
