import { useState } from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import {
  FlowOperationType,
  FlowStatus,
  isNil,
  PopulatedFlow,
} from '@activepieces/shared';

import { Switch } from '../../../components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { flowsApi } from '../lib/flows-api';
import { flowsUtils } from '../lib/flows-utils';

export default function FlowStatusToggle({ flow }: { flow: PopulatedFlow }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(
    flow.status === FlowStatus.ENABLED,
  );

  const onCheckedChange = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await flowsApi.applyOperation(flow.id, {
        type: FlowOperationType.CHANGE_STATUS,
        request: {
          status: checked ? FlowStatus.ENABLED : FlowStatus.DISABLED,
        },
      });
      setIsChecked(checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Switch
              defaultChecked={flow.status === FlowStatus.ENABLED}
              onCheckedChange={onCheckedChange}
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
                {flowsUtils.flowStatusIconRenderer(flow)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {flowsUtils.flowStatusToolTipRenderer(flow)}
            </TooltipContent>
          </Tooltip>
        )
      )}
    </>
  );
}
