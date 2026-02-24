import { t } from 'i18next';
import { EyeIcon, PencilIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-use';

import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { FlowVersionState, Permission } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasHooks } from '../../flow-canvas/hooks';
import { AboveTriggerButton } from '../../flow-canvas/widgets/above-trigger-button';

const EditFlowOrViewDraftButton = ({ onCanvas }: { onCanvas: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const { switchToDraft, isSwitchingToDraftPending } =
    flowCanvasHooks.useSwitchToDraft();
  const [flowVersion, flowId, readonly, run] = useBuilderStateContext(
    (state) => [state.flowVersion, state.flow.id, state.readonly, state.run],
  );
  const isViewingDraft = flowVersion.state === FlowVersionState.DRAFT;
  const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  if (!readonly || (isViewingDraft && !run)) {
    return null;
  }
  const handleClick = () => {
    if (location.pathname?.includes('/runs')) {
      navigate(`/flows/${flowId}`);
    } else {
      switchToDraft();
    }
  };
  const { text, icon } = getButtonTextAndIcon({
    hasPermissionToEditFlow: permissionToEditFlow,
  });

  return (
    <>
      {onCanvas && (
        <AboveTriggerButton
          shortCutIsEscape={true}
          showPrimaryBg={false}
          onClick={handleClick}
          text={text}
        ></AboveTriggerButton>
      )}

      {!onCanvas && (
        <Button
          size={'sm'}
          variant={'basic'}
          loading={isSwitchingToDraftPending}
          className="gap-2"
          onClick={() => {
            if (location.pathname?.includes('/runs')) {
              navigate(`/flows/${flowId}`);
            } else {
              switchToDraft();
            }
          }}
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
