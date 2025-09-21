import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { FlowVersionState, Permission } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { Send } from 'lucide-react';

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
  const { mutate: publish } = flowsHooks.usePublishFlow({
    flowId: flow.id,
    setFlow,
    setVersion,
    setIsPublishing,
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
            disabled={isPublishedVersion}
            onClick={() => publish()}
            className=''
            style={{
              background: 'radial-gradient(47.57% 136.11% at 2.91% 6.94%, #9B5CFD 0%, #5305CC 100%)'
            }}
          >
            <Send />
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
