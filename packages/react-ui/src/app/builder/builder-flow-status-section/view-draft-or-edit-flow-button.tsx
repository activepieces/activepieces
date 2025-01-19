import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-use";
import { useBuilderStateContext, useSwitchToDraft } from "../builder-hooks";
import { t } from "i18next";
import { FlowVersionState, isNil, Permission } from "../../../../../shared/src";
import { useAuthorization } from "@/hooks/authorization-hooks";

const EditFlowOrViewDraftButton = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {checkAccess} = useAuthorization();
    const {switchToDraft, isSwitchingToDraftPending} = useSwitchToDraft();
    const [flowVersion,flowId,readonly] = useBuilderStateContext((state) => [state.flowVersion,state.flow.id,state.readonly]);
    const isViewingDraft = flowVersion.state === FlowVersionState.DRAFT;
    const permissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
    if(!readonly || isViewingDraft) {
      return null;
    }
   
    return <Button
    size={'sm'}
    variant={'outline'}
    loading={isSwitchingToDraftPending}
    onClick={() => {
      if (location.pathname?.includes('/runs')) {
        navigate(`/flows/${flowId}`);
      } else {
        switchToDraft();
      }
    }}
  >
    {
        permissionToEditFlow ? t('Edit Flow') : t('View Draft')
    }
  </Button>
}
EditFlowOrViewDraftButton.displayName = 'EditFlowOrViewDraftButton';
export { EditFlowOrViewDraftButton };