import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  useBuilderStateContext,
  useSwitchToDraft,
} from '@/app/builder/builder-hooks';
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
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  FlowOperationType,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';

const BuilderPublishButton = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToUpdateFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );
  const [flowVersion, flow, isSaving, setVersion, setFlow, readonly, run] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.flow,
      state.saving,
      state.setVersion,
      state.setFlow,
      state.readonly,
      state.run,
    ]);

  const { switchToDraft, isSwitchingToDraftPending } = useSwitchToDraft();
  const { mutate: publish, isPending: isPublishingPending } = useMutation({
    mutationFn: async () => {
      return flowsApi.update(flow.id, {
        type: FlowOperationType.LOCK_AND_PUBLISH,
        request: {},
      });
    },
    onSuccess: (flow) => {
      toast({
        title: t('Success'),
        description: t('Flow has been published.'),
        duration: 3000,
      });
      setFlow(flow);
      setVersion(flow.version);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const isPublishedVersion =
    flow.publishedVersionId === flowVersion.id &&
    flowVersion.state === FlowVersionState.LOCKED;
  const isViewingDraft =
    (flow.publishedVersionId === flowVersion.id &&
      flow.version.id === flowVersion.id) ||
    flowVersion.state === FlowVersionState.DRAFT;

  return (
    <>
      {!run && userHasPermissionToUpdateFlowStatus && (
        <>
          {flow.publishedVersionId && (
            <div className="flex items-center space-x-2">
              <FlowVersionStateDot
                state={flowVersion.state}
                versionId={flowVersion.id}
                publishedVersionId={flow.publishedVersionId}
              ></FlowVersionStateDot>
              {(flow.publishedVersionId === flowVersion.id ||
                flowVersion.state === FlowVersionState.DRAFT) && (
                <FlowStatusToggle
                  flow={flow}
                  flowVersion={flowVersion}
                ></FlowStatusToggle>
              )}
            </div>
          )}

          {isViewingDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  asChild
                  className="disabled:pointer-events-auto"
                >
                  <Button
                    size={'sm'}
                    loading={isSaving || isPublishingPending}
                    disabled={isPublishedVersion || !flowVersion.valid}
                    onClick={() => publish()}
                  >
                    {t('Publish')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isPublishedVersion
                    ? t('Latest version is published')
                    : !flowVersion.valid
                    ? t('Your flow has incomplete steps')
                    : t('Publish')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
      {userHasPermissionToUpdateFlowStatus &&
        !userHasPermissionToEditFlow &&
        (run || !isViewingDraft) && (
          <Button
            size={'sm'}
            variant={'outline'}
            loading={isSwitchingToDraftPending || isSaving}
            onClick={() => {
              if (location.pathname.includes('/runs')) {
                navigate(`/flows/${flow.id}`);
              } else {
                switchToDraft();
              }
            }}
          >
            {t('View Draft')}
          </Button>
        )}

      {userHasPermissionToEditFlow && readonly && (
        <Button
          size={'sm'}
          variant={'outline'}
          loading={isSwitchingToDraftPending || isSaving}
          onClick={() => {
            if (location.pathname.includes('/runs')) {
              navigate(`/flows/${flow.id}`);
            } else {
              switchToDraft();
            }
          }}
        >
          {t('Edit Flow')}
        </Button>
      )}
    </>
  );
});

BuilderPublishButton.displayName = 'BuilderPublishButton';
export { BuilderPublishButton };
