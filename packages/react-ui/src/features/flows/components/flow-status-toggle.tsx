import {
  FlowOperationType,
  FlowStatus,
  Flow,
  isNil,
  PopulatedFlow,
} from '@activepieces/shared';
import { TimerReset, TriangleAlert, Zap } from 'lucide-react';
import { useState } from 'react';

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

  const renderIcon = (flow: PopulatedFlow) => {
    const view = flowsUtils.flowStatusIconRenderer(flow);
    const icons = {
      'timer-reset': <TimerReset className="h-4 w-4 text-[#000000]" />,
      zap: <Zap className="h-4 w-4 text-[#000000] fill-[#000000]" />,
      warn: <TriangleAlert className="h-4 w-4 text-destructive" />,
    };
    return icons[view] || null;
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
      {isChecked && (
        <Tooltip>
          <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div className="p-2 rounded-full hover:bg-muted">
              {renderIcon(flow)}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {flowsUtils.flowStatusToolTipRenderer(flow)}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
