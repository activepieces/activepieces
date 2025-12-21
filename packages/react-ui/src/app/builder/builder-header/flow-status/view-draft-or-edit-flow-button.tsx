import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-use';

import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { FlowVersionState, Permission } from '@activepieces/shared';

import { useBuilderStateContext, useSwitchToDraft } from '../../builder-hooks';
import { AboveTriggerButton } from '../../flow-canvas/widgets/above-trigger-button';

const EditFlowOrViewDraftButton = ({onCanvas}: {onCanvas: boolean}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const { switchToDraft, isSwitchingToDraftPending } = useSwitchToDraft();
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
  const text = permissionToEditFlow ? t('Edit Flow') : t('View Draft');

  return (
  <>
     {
      onCanvas && (
         <AboveTriggerButton shortCutIsEscape={true} onClick={handleClick} text={text}>
         </AboveTriggerButton >
      )
     }

     {
      !onCanvas && (
        <Button
        size={'sm'}
        variant={'default'}
        loading={isSwitchingToDraftPending}
        onClick={() => {
          if (location.pathname?.includes('/runs')) {
            navigate(`/flows/${flowId}`);
          } else {
            switchToDraft();
          }
        }}
      >
        {text}
      </Button>
      )
     }
  </>
  );
};
EditFlowOrViewDraftButton.displayName = 'EditFlowOrViewDraftButton';
export { EditFlowOrViewDraftButton };
