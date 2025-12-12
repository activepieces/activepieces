import { t } from 'i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  FlowStatusUpdatedResponse,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

const PublishButton = () => {
  const { checkAccess } = useAuthorization();
  const [
    flowVersion,
    flow,
    setFlow,
    setVersion,
    isSaving,
    readonly,
    isPublishing,
    setIsPublishing,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
    state.setFlow,
    state.setVersion,
    state.saving,
    state.readonly,
    state.isPublishing,
    state.setIsPublishing,
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
      toast.success(t('Your flow is now published.'), {
        duration: 3000,
      });
    },
    setIsPublishing: setIsPublishing,
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
