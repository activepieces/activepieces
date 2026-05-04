import {
  FlowApprovalRequestState,
  isNil,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { flowApprovalsHooks } from '@/features/flow-approvals';
import { flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { EditFlowOrViewDraftButton } from '../../builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '../../builder-hooks';
import { OverwriteDraftDialog } from '../../flow-versions/overwrite-draft-dialog';

import LargeWidgetWrapper from './large-widget-wrapper';

const ViewingOldVersionWidget = () => {
  const [run, readonly, version, isPublishing, flow] = useBuilderStateContext(
    (state) => [
      state.run,
      state.readonly,
      state.flowVersion,
      state.isPublishing,
      state.flow,
    ],
  );
  const versionNumber = flowHooks
    .useGetFlowVersionNumber({ flowId: version.flowId, versionId: version.id })
    .toString();
  const { checkAccess } = useAuthorization();
  const hasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const { data: approvals } = flowApprovalsHooks.useListApprovalsForFlow(
    flow.id,
  );
  const hasPendingApprovalForThisVersion = (approvals ?? []).some(
    (request) =>
      request.flowVersionId === version.id &&
      request.state === FlowApprovalRequestState.PENDING,
  );
  if (
    !isNil(run) ||
    !readonly ||
    isPublishing ||
    hasPendingApprovalForThisVersion
  ) {
    return null;
  }
  return (
    <LargeWidgetWrapper>
      <>
        <div className="flex items-center gap-2">
          <Info className="size-5" />
          <span>
            {t('Viewing version')} #{versionNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasPermissionToWriteFlow && (
            <OverwriteDraftDialog
              versionId={version.id}
              versionNumber={versionNumber}
              onConfirm={undefined}
            >
              <Button variant="ghost" size="sm">
                {t('Use as Draft')}
              </Button>
            </OverwriteDraftDialog>
          )}
          <EditFlowOrViewDraftButton
            onCanvas={false}
          ></EditFlowOrViewDraftButton>
        </div>
      </>
    </LargeWidgetWrapper>
  );
};
export { ViewingOldVersionWidget };
