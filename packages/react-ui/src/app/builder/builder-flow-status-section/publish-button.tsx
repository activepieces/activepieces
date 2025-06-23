import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  FlowOperationType,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

const PublishButton = () => {
  const { checkAccess } = useAuthorization();
  const [flowVersion, flow, setFlow, setVersion, isSaving, readonly] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.flow,
      state.setFlow,
      state.setVersion,
      state.saving,
      state.readonly,
    ]);
  const isViewingDraft =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const isPublishedVersion = flowVersion.id === flow.publishedVersionId;
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
      });
      setFlow(flow);
      setVersion(flow.version);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });
  if (!permissionToEditFlow || !isViewingDraft || readonly) {
    return null;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
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
  );
};

PublishButton.displayName = 'PublishButton';
export { PublishButton };
