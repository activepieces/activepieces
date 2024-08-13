import { FlowOperationType, FlowVersionState } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { flowsApi } from '@/features/flows/lib/flows-api';

const BuilderPublishButton = React.memo(() => {
  const [flowVersion, flow, isSaving, setVersion, setFlow, readonly] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.flow,
      state.saving,
      state.setVersion,
      state.setFlow,
      state.readonly,
    ]);

  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    useMutation({
      mutationFn: async () => {
        const flow = await flowsApi.get(flowVersion.flowId);
        return flow;
      },
      onSuccess: (flow) => {
        setVersion(flow.version);
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    });

  const { mutate: publish, isPending: isPublishingPending } = useMutation({
    mutationFn: async () => {
      return flowsApi.update(flow.id, {
        type: FlowOperationType.LOCK_AND_PUBLISH,
        request: {},
      });
    },
    onSuccess: (flow) => {
      toast({
        title: 'Success',
        description: 'Flow has been published.',
        duration: 3000,
      });
      setVersion(flow.version);
      setFlow(flow);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const isPublishedVersion =
    flow.publishedVersionId === flowVersion.id &&
    flowVersion.state === FlowVersionState.LOCKED;
  return (
    <>
      {flow.publishedVersionId && (
        <div className="flex items-center space-x-2">
          <FlowVersionStateDot state={flowVersion.state}></FlowVersionStateDot>
          <FlowStatusToggle
            flow={flow}
            flowVersion={flowVersion}
          ></FlowStatusToggle>
        </div>
      )}

      {!readonly && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="disabled:pointer-events-auto">
              <Button
                size={'sm'}
                loading={isSaving || isPublishingPending}
                disabled={isPublishedVersion || readonly}
                onClick={() => publish()}
              >
                Publish
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isPublishedVersion ? 'Latest version is published' : 'Publish'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {readonly && (
        <Button
          size={'sm'}
          variant={'outline'}
          loading={isSwitchingToDraftPending || isSaving}
          onClick={() => switchToDraft()}
        >
          Edit Flow
        </Button>
      )}
    </>
  );
});

BuilderPublishButton.displayName = 'BuilderPublishButton';
export { BuilderPublishButton };
