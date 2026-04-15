import {
  FlowStatus,
  Permission,
  PopulatedFlow,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { Switch } from '../../../components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { flowHooks } from '../hooks/flow-hooks';
import { flowsUtils } from '../utils/flows-utils';

type FlowStatusToggleProps = {
  flow: PopulatedFlow;
};

const FlowStatusToggle = ({ flow }: FlowStatusToggleProps) => {
  const [isFlowPublished, setIsFlowPublished] = useState(
    flow.status === FlowStatus.ENABLED,
  );

  useEffect(() => {
    setIsFlowPublished(flow.status === FlowStatus.ENABLED);
  }, [flow]);

  const { checkAccess } = useAuthorization();
  const userHasPermissionToToggleFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );

  const { mutate: changeStatus, isPending: isLoading } =
    flowHooks.useChangeFlowStatus({
      flowId: flow.id,
      change: isFlowPublished ? FlowStatus.DISABLED : FlowStatus.ENABLED,
      onSuccess: (updatedFlow: PopulatedFlow) => {
        setIsFlowPublished(updatedFlow.status === FlowStatus.ENABLED);
      },
    });

  return (
    <div className="flex items-center justify-start">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Switch
              checked={isFlowPublished}
              onCheckedChange={() => changeStatus()}
              disabled={
                isLoading ||
                !userHasPermissionToToggleFlowStatus ||
                isNil(flow.publishedVersionId)
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {userHasPermissionToToggleFlowStatus
            ? isNil(flow.publishedVersionId)
              ? t('Please publish flow first')
              : isFlowPublished
              ? t('Flow is on')
              : t('Flow is off')
            : t('Permission Needed')}
        </TooltipContent>
      </Tooltip>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        isFlowPublished && (
          <Tooltip>
            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
              <div className="p-2 rounded-full ">
                {flowsUtils.flowStatusIconRenderer(flow)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {flowsUtils.flowStatusToolTipRenderer(flow)}
            </TooltipContent>
          </Tooltip>
        )
      )}
    </div>
  );
};

FlowStatusToggle.displayName = 'FlowStatusToggle';
export { FlowStatusToggle };
