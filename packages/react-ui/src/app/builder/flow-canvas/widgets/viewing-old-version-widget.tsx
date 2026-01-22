import { InfoCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { isNil, Permission } from '@activepieces/shared';

import { EditFlowOrViewDraftButton } from '../../builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '../../builder-hooks';
import { OverwriteDraftDialog } from '../../flow-versions/overwrite-draft-dialog';

import LargeWidgetWrapper from './large-widget-wrapper';

const ViewingOldVersionWidget = () => {
  const [run, readonly, version, isPublishing] = useBuilderStateContext(
    (state) => [
      state.run,
      state.readonly,
      state.flowVersion,
      state.isPublishing,
    ],
  );
  const versionNumber = flowHooks
    .useGetFlowVersionNumber({ flowId: version.flowId, versionId: version.id })
    .toString();
  const { checkAccess } = useAuthorization();
  const hasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  if (!isNil(run) || !readonly || isPublishing) {
    return null;
  }
  return (
    <LargeWidgetWrapper>
      <>
        <div className="flex items-center gap-2">
          <InfoCircledIcon className="size-5" />
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
