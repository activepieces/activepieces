import { Permission, isNil } from '@activepieces/core-utils';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoadingSpinner } from '@/components/custom/spinner';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { Switch } from '../../../components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { flowHooks } from '../hooks/flow-hooks';
import { flowScheduleLabelUtils } from '../utils/flow-schedule-label';

type FlowStatusToggleProps = {
  flow: PopulatedFlow;
};

const FlowStatusToggle = ({ flow }: FlowStatusToggleProps) => {
  const { t, i18n } = useTranslation();
  const [toggledFlow, setToggledFlow] = useState<PopulatedFlow | null>(null);
  const currentFlow =
    !isNil(toggledFlow) &&
    toggledFlow.id === flow.id &&
    new Date(toggledFlow.updated) >= new Date(flow.updated)
      ? toggledFlow
      : flow;
  const isFlowOn = currentFlow.status === FlowStatus.ENABLED;

  const { checkAccess } = useAuthorization();
  const userHasPermissionToToggleFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );

  const { mutate: changeStatus, isPending: isLoading } =
    flowHooks.useChangeFlowStatus({
      flowId: flow.id,
      change: isFlowOn ? FlowStatus.DISABLED : FlowStatus.ENABLED,
      onSuccess: (updatedFlow: PopulatedFlow) => {
        setToggledFlow(updatedFlow);
      },
    });

  const isNeverPublished = isNil(currentFlow.publishedVersionId);
  const label =
    isFlowOn && !isLoading
      ? flowScheduleLabelUtils.describe({
          flow: currentFlow,
          locale: i18n.language,
        })
      : null;

  return (
    <div className="flex items-center justify-start">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Switch
              checked={isFlowOn}
              onCheckedChange={() => changeStatus()}
              disabled={
                isLoading ||
                !userHasPermissionToToggleFlowStatus ||
                isNeverPublished
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {userHasPermissionToToggleFlowStatus
            ? isNeverPublished
              ? t('Please publish flow first')
              : isFlowOn
              ? t('Flow is on')
              : t('Flow is off')
            : t('Permission Needed')}
        </TooltipContent>
      </Tooltip>
      {isLoading && (
        <div className="ml-2 flex items-center gap-1.5 text-xs text-gray-11">
          <LoadingSpinner className="size-3" />
          {isFlowOn ? t('Turning off…') : t('Turning on…')}
        </div>
      )}
      {!isLoading && isNeverPublished && (
        <span className="ml-2 text-xs text-gray-11">{t('Not published')}</span>
      )}
      {label && (
        <Tooltip>
          <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
            <div className="ml-2 flex min-w-0 max-w-[100px] flex-col text-xs leading-4">
              <span className="truncate text-gray-12">{label.title}</span>
              <span className="truncate text-gray-11">{label.detail}</span>
              <span className="sr-only">{label.tooltip}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[280px]">
            {label.tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

FlowStatusToggle.displayName = 'FlowStatusToggle';
export { FlowStatusToggle };
