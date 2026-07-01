import { isNil, Permission } from '@activepieces/core-utils';
import {
  FlowRun,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import { RightSideBarType } from '@/app/builder/types';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { useBuilderStateContext } from '../../builder-hooks';

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
    onSuccess: (updatedFlow: PopulatedFlow) => {
      setFlow(updatedFlow);
      setVersion(updatedFlow.version);
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
  const showLoading = isPublishing || isDiscardingChanges || isSaving;
  const loadingText = pickLoadingText({
    isDiscardingChanges,
    isPublishing,
    isSaving,
  });
  return (
    <div className="absolute inset-x-0 top-0 z-40 flex min-h-11 w-full items-center justify-between gap-3 border-b border-warning-300 bg-warning-100 px-4 py-2 animate-fade duration-300">
      <div className="flex items-center gap-2 text-sm font-medium text-warning-900">
        <Info className="size-4 shrink-0 text-warning-600" />
        {showLoading ? loadingText : t('You have unpublished changes')}
      </div>
      {showLoading ? (
        <LoadingSpinner className="size-4 stroke-warning-700" />
      ) : (
        <div className="flex items-center gap-1">
          {!isNil(flow.publishedVersionId) && !isSaving && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-warning-900 hover:bg-warning-200"
              onClick={() => discardChange()}
            >
              {t('Discard')}
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="tooltip-wrapper">
                <Button
                  size="sm"
                  variant="default"
                  className="z-50 h-7 rounded-full px-3.5"
                  loading={isSaving}
                  //for e2e tests
                  name="Publish"
                  onClick={() => publish()}
                  disabled={!isValid}
                >
                  {t('Publish')}
                </Button>
              </div>
            </TooltipTrigger>
            {isSaving && <TooltipContent>{t('Saving...')}</TooltipContent>}
            {!isValid && (
              <TooltipContent>{t('You have incomplete steps')}</TooltipContent>
            )}
          </Tooltip>
        </div>
      )}
    </div>
  );
};

PublishFlowReminderWidget.displayName = 'PublishFlowReminderWidget';
export { PublishFlowReminderWidget };

const useShouldShowPublishButton = ({
  flowVersion,
  isPublishing,
  run,
  isSaving,
}: {
  flowVersion: FlowVersion;
  isPublishing: boolean;
  run: FlowRun | null;
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
    isNil(run)
  );
};

function pickLoadingText({
  isDiscardingChanges,
  isPublishing,
  isSaving,
}: {
  isDiscardingChanges: boolean;
  isPublishing: boolean;
  isSaving: boolean;
}) {
  if (isSaving) {
    return t('Saving...');
  }
  if (isDiscardingChanges) {
    return t('Discarding changes...');
  }
  if (isPublishing) {
    return t('Publishing...');
  }
  return '';
}
