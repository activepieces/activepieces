import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  Flow,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  Permission,
  PopulatedFlow,
  WebsocketClientEvent,
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
import { useSocket } from '@/components/socket-provider';

type FlowStatusToggleProps = {
  flow: PopulatedFlow;
};

const FlowStatusToggle = ({ flow }: FlowStatusToggleProps) => {
  const [isFlowPublished, setIsChecked] = useState(
    flow.status === FlowStatus.ENABLED,
  );
  const [operationStatus, setOperationStatus] = useState(flow.operationStatus);
  const socket = useSocket();

  const { checkAccess } = useAuthorization();
  const userHasPermissionToToggleFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );

  useEffect(() => {
    setIsChecked(flow.status === FlowStatus.ENABLED);
    setOperationStatus(flow.operationStatus);
  }, [flow.status, flow.operationStatus]);

  const { mutate: changeStatus, isPending: isLoading } = useMutation<
    PopulatedFlow,
    Error,
    void
  >({
    mutationFn: async (): Promise<PopulatedFlow> => {
      return flowsApi.update(flow.id, {
        type: FlowOperationType.CHANGE_STATUS,
        request: {
          status: isFlowPublished ? FlowStatus.DISABLED : FlowStatus.ENABLED,
        },
      });
    },
    onSuccess: (flow) => {
      setOperationStatus(flow.operationStatus);
      const onFinish = ({ flow, status, error }: { flow?: Flow, status: "success" | "failed", error?: string }) => {
          if (status === "failed") {
            toast({
              title: t('Error'),
              description: t('Failed to change flow status: {error}', { error }),
              variant: 'destructive',
            });
            setOperationStatus(FlowOperationStatus.NONE);
            return;
          }
          if (flow) {
            setIsChecked(flow.status === FlowStatus.ENABLED);
            setOperationStatus(flow.operationStatus);
          }
          socket.off(WebsocketClientEvent.FLOW_STATUS_UPDATED, onFinish);
      } 
      socket.on(WebsocketClientEvent.FLOW_STATUS_UPDATED, onFinish);
    },
    onError: (err: Error) => {
      toast({
        title: t('Error'),
        description: t('Failed to change flow status, please contact support.'),
        variant: 'destructive',
      });
      console.error('Failed to change flow status', err);
    },
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Switch
              checked={isFlowPublished}
              onCheckedChange={() => changeStatus()}
              disabled={
                isLoading ||
                !userHasPermissionToToggleFlowStatus ||
                operationStatus !== FlowOperationStatus.NONE ||
                isNil(flow.publishedVersionId)
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {userHasPermissionToToggleFlowStatus
            ? isNil(flow.publishedVersionId)
              ? t('Please publish flow first')
              : operationStatus !== FlowOperationStatus.NONE
              ? t(`${operationStatus.toLowerCase()} flow ...`)
              : isFlowPublished
              ? t('Flow is on')
              : t('Flow is off')
            : t('Permission Needed')}
        </TooltipContent>
      </Tooltip>
      {isLoading || operationStatus !== FlowOperationStatus.NONE ? (
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
    </>
  );
};

FlowStatusToggle.displayName = 'FlowStatusToggle';
export { FlowStatusToggle };
