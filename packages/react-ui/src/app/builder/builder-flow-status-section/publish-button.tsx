import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { FlowStatusUpdatedResponse, FlowVersionState, Permission } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { flowHooks } from '@/features/flows/lib/flows-hooks';

const PublishButton = () => {
  const { checkAccess } = useAuthorization();
  const [
    flowVersion,
    flow,
    setFlow,
    setVersion,
    isSaving,
    readonly,
    setIsPublishing,
    isPublishing,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
    state.setFlow,
    state.setVersion,
    state.saving,
    state.readonly,
    state.setIsPublishing,
    state.isPublishing,
  ]);
  const isViewingDraft =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const isPublishedVersion = flowVersion.id === flow.publishedVersionId;
  const { mutate: publish } = flowHooks.useChangeFlowStatus({
    flowId: flow.id,
    change: 'publish',
    onSuccess: (response: FlowStatusUpdatedResponse) => {
      setFlow(response.flow);
      setVersion(response.flow.version);
      setIsPublishing(false);
    },
  });
  if (!permissionToEditFlow || !isViewingDraft || (readonly && !isPublishing)) {
    return null;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
          <Button
            size={'sm'}
            loading={isSaving || isPublishing}
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
  );
};

PublishButton.displayName = 'PublishButton';
export { PublishButton };
