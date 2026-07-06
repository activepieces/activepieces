import { isNil, Permission } from '@activepieces/core-utils';
import {
  embedConstraintsUtil,
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
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';

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
    isSaving,
  });
  const embedConstraints = embedConstraintsUtil.getEmbedConstraints(flow);
  const satisfiesRequiredPiece =
    embedConstraintsUtil.flowSatisfiesRequiredPiece({
      version: flowVersion,
      constraints: embedConstraints,
    });
  const { summaries: requiredPieceSummaries } =
    piecesHooks.usePieceSummariesByNames({
      names: embedConstraints?.requiredPieceNames ?? [],
    });
  const canPublish = isValid && satisfiesRequiredPiece;
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
    <LargeWidgetWrapper>
      <div className="flex items-center gap-2">
        <Info className="size-5" />
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
              <div className="tooltip-wrapper">
                <Button
                  size="sm"
                  variant="default"
                  className="z-50"
                  loading={isSaving}
                  //for e2e tests
                  name="Publish"
                  onClick={() => publish()}
                  disabled={!canPublish}
                >
                  {t('Publish')}
                </Button>
              </div>
            </TooltipTrigger>
            {isSaving && <TooltipContent>{t('Saving...')}</TooltipContent>}
            {!isSaving && !isValid && (
              <TooltipContent>{t('You have incomplete steps')}</TooltipContent>
            )}
            {!isSaving && isValid && !satisfiesRequiredPiece && (
              <TooltipContent>
                {requiredPieceSummaries.length > 0
                  ? t(
                      'This flow must include the {pieceName} step to publish',
                      {
                        pieceName: requiredPieceSummaries
                          .map((piece) => piece.displayName)
                          .join(t(' or ')),
                      },
                    )
                  : t('This flow is missing a required step to publish')}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}
    </LargeWidgetWrapper>
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
