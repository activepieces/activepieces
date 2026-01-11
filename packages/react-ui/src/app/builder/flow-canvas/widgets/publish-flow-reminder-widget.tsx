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
import { RightSideBarType } from '@/lib/types';
import {
  FlowRun,
  FlowStatusUpdatedResponse,
  FlowVersion,
  FlowVersionState,
  isNil,
  Permission,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

import LargeWidgetWrapper from './large-widget-wrapper';

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
    flowVersion,
    run,
  ] = useBuilderStateContext((state) => [
    state.saving,
    state.isPublishing,
    state.setIsPublishing,
    state.flowVersion.valid,
    state.flow,
    state.setFlow,
    state.setVersion,
    state.setRightSidebar,
    state.flowVersion,
    state.run,
  ]);
  const showShouldPublishButton = useShouldShowPublishButton({
    flowVersion,
    isPublishing,
    run,
    isValid,
    isSaving,
  });
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

  if (!showShouldPublishButton) {
    return null;
  }
  const showLoading = isPublishing || isDiscardingChanges;
  const loadingText = isDiscardingChanges
    ? t('Discarding changes...')
    : t('Publishing...');
  return (
    <LargeWidgetWrapper>
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
              {t('Discard changes')}
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="default"
                loading={isSaving}
                //for e2e tests
                name="Publish"
                onClick={() => publish()}
              >
                {t('Publish')}
              </Button>
            </TooltipTrigger>
            {isSaving && <TooltipContent>{t('Saving...')}</TooltipContent>}
          </Tooltip>
        </div>
      )}
    </LargeWidgetWrapper>
  );
};

PublishFlowReminderWidget.displayName = 'PublishFlowReminderWidget';
export default PublishFlowReminderWidget;

const useShouldShowPublishButton = ({
  flowVersion,
  isPublishing,
  run,
  isValid,
  isSaving,
}: {
  flowVersion: FlowVersion;
  isPublishing: boolean;
  run: FlowRun | null;
  isValid: boolean;
  isSaving: boolean;
}) => {
  const { checkAccess } = useAuthorization();
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const isViewingPublishableVersion =
    flowVersion.state === FlowVersionState.DRAFT;
  return (
    ((permissionToEditFlow && isViewingPublishableVersion) ||
      isPublishing ||
      isSaving) &&
    isNil(run) &&
    isValid
  );
};
