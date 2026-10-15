import { Permission } from '@activepieces/core-utils';
import { FlowVersionState } from '@activepieces/shared';
import { t } from 'i18next';
import { EyeIcon, PencilIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasHooks } from '../../flow-canvas/hooks';
import { AboveTriggerButton } from '../../flow-canvas/widgets/above-trigger-button';

const EditFlowOrViewDraftButton = ({ onCanvas }: { onCanvas: boolean }) => {
  const { checkAccess } = useAuthorization();
  const { openDraft, isOpeningDraft } = flowCanvasHooks.useOpenDraft();
  const [flowVersion, readonly, run] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.readonly,
    state.run,
  ]);
  const isViewingDraft = flowVersion.state === FlowVersionState.DRAFT;
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  if (!readonly || (isViewingDraft && !run)) {
    return null;
  }
  const { text, icon } = getButtonTextAndIcon({
    hasPermissionToEditFlow: permissionToEditFlow,
  });

  return (
    <>
      {onCanvas && (
        <AboveTriggerButton
          shortCutIsEscape={true}
          showPrimaryBg={false}
          onClick={openDraft}
          text={text}
        ></AboveTriggerButton>
      )}

      {!onCanvas && (
        <Button
          size={'sm'}
          variant={'basic'}
          loading={isOpeningDraft}
          className="gap-2"
          onClick={openDraft}
        >
          {icon}
          {text}
        </Button>
      )}
    </>
  );
};
EditFlowOrViewDraftButton.displayName = 'EditFlowOrViewDraftButton';
export { EditFlowOrViewDraftButton };
function getButtonTextAndIcon({
  hasPermissionToEditFlow,
}: {
  hasPermissionToEditFlow: boolean;
}) {
  const text = hasPermissionToEditFlow ? t('Edit flow') : t('View draft');

  if (hasPermissionToEditFlow) {
    return {
      icon: <PencilIcon className="size-4" />,
      text,
    };
  }
  return {
    icon: <EyeIcon className="size-4" />,
    text,
  };
}
