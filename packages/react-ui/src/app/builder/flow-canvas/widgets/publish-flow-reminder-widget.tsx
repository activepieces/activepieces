import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  FlowStatusUpdatedResponse,
  FlowVersionState,
  isNil,
  Permission,
} from '@activepieces/shared';

import { RightSideBarType, useBuilderStateContext } from '../../builder-hooks';

const PublishFlowReminderWidget = () => {
  const [
    isSaving,
    isPublishing,
    setIsPublishing,
    isValid,
    flow,
    setFlow,
    setVersion,
    setRightSidebar,
  ] = useBuilderStateContext((state) => [
    state.saving,
    state.isPublishing,
    state.setIsPublishing,
    state.flowVersion.valid,
    state.flow,
    state.setFlow,
    state.setVersion,
    state.setRightSidebar,
  ]);
  const showShouldPublishButton = useShouldShowPublishButton();
  const { mutate: discardChange, isPending: isDiscardingChanges } = useMutation(
    {
      mutationFn: async () => {
        if (!flow.publishedVersionId) {
          return;
        }
        await overWriteDraftWithVersion({
          flowId: flow.id,
          versionId: flow.publishedVersionId,
        });
        await publish();
      },
    },
  );
  const { mutateAsync: publish } = flowHooks.useChangeFlowStatus({
    flowId: flow.id,
    change: 'publish',
    onSuccess: (response: FlowStatusUpdatedResponse) => {
      setFlow(response.flow);
      setVersion(response.flow.version);
    },
    setIsPublishing: setIsPublishing,
  });
  const { mutateAsync: overWriteDraftWithVersion } =
    flowHooks.useOverWriteDraftWithVersion({
      onSuccess: (updatedFlow) => {
        setVersion(updatedFlow.version);
        setRightSidebar(RightSideBarType.NONE);
      },
    });
  const showLoading = isPublishing || isDiscardingChanges;
  const loadingText = isDiscardingChanges
    ? t('Discarding changes...')
    : t('Publishing...');
  if (!showShouldPublishButton || !isValid) {
    return null;
  }
  return (
    <div
      id="publish-flow-reminder-widget"
      className="absolute top-[8px] z-40 w-full px-2"
    >
      <div className="py-1.5 px-3 border min-h-11.5 border border-border  bg-background shadow-sm z-40  w-full animate animate-fade duration-300 rounded-md  flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InfoCircledIcon className="size-5" />
          {showLoading ? loadingText : t('You have unpublished changes')}
        </div>
        {showLoading ? (
          <LoadingSpinner className="size-5 stroke-foreground" />
        ) : (
          <div className="flex items-center gap-2">
            {!isNil(flow.publishedVersionId) && !isSaving && (
              <Button
                size="sm"
                variant="ghost"
                className="hover:bg-gray-300/10 text-foreground"
                onClick={() => discardChange()}
              >
                {t('Discard Changes')}
              </Button>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  loading={isSaving}
                  onClick={() => publish()}
                >
                  {t('Publish')}
                </Button>
              </TooltipTrigger>
              {isSaving && <TooltipContent>{t('Saving...')}</TooltipContent>}
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

PublishFlowReminderWidget.displayName = 'PublishFlowReminderWidget';
export default PublishFlowReminderWidget;

const useShouldShowPublishButton = () => {
  const [flowVersion, isPublishing] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.isPublishing,
    state.flow,
  ]);
  const { checkAccess } = useAuthorization();
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const isViewingPublishableVersion =
    flowVersion.state === FlowVersionState.DRAFT;
  return (permissionToEditFlow && isViewingPublishableVersion) || isPublishing;
};
