import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  Flow,
  FlowOperationType,
  FlowStatus,
  FlowVersion,
  PopulatedFlow,
  isNil,
} from '@activepieces/shared';

import { Switch } from '../../../components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { flowsApi } from '../lib/flows-api';
import { flowsUtils } from '../lib/flows-utils';

type FlowStatusToggleProps = {
  flow: Flow;
  flowVersion: FlowVersion;
};

const FlowStatusToggle = ({ flow, flowVersion }: FlowStatusToggleProps) => {
  const [isChecked, setIsChecked] = useState(
    flow.status === FlowStatus.ENABLED,
  );

  useEffect(() => {
    setIsChecked(flow.status === FlowStatus.ENABLED);
  }, [flow.status]);

  const { mutate: changeStatus, isPending: isLoading } = useMutation<
    PopulatedFlow,
    Error,
    void
  >({
    mutationFn: async (): Promise<PopulatedFlow> => {
      return flowsApi.applyOperation(flow.id, {
        type: FlowOperationType.CHANGE_STATUS,
        request: {
          status: isChecked ? FlowStatus.DISABLED : FlowStatus.ENABLED,
        },
      });
    },
    onSuccess: (flow) => {
      setIsChecked(flow.status === FlowStatus.ENABLED);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Switch
              checked={isChecked}
              onCheckedChange={() => changeStatus()}
              disabled={isLoading || isNil(flow.publishedVersionId)}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isNil(flow.publishedVersionId)
            ? 'Please publish flow first'
            : flow.status === FlowStatus.ENABLED
            ? 'Flow is on'
            : 'Flow is off'}
        </TooltipContent>
      </Tooltip>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        isChecked && (
          <Tooltip>
            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
              <div className="p-2 rounded-full hover:bg-muted">
                {flowsUtils.flowStatusIconRenderer(flow, flowVersion)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {flowsUtils.flowStatusToolTipRenderer(flow, flowVersion)}
            </TooltipContent>
          </Tooltip>
        )
      )}
    </>
  );
};

FlowStatusToggle.displayName = 'FlowStatusToggle';
export { FlowStatusToggle };
