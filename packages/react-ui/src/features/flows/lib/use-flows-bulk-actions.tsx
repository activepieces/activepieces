import { t } from 'i18next';
import { CornerUpLeft, Download, Trash2, UploadCloud } from 'lucide-react';
import { useMemo } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { BulkAction } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/spinner';
import { PublishedNeededTooltip } from '@/features/git-sync/components/published-tooltip';
import { PushToGitDialog } from '@/features/git-sync/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { GitBranchType } from '@activepieces/ee-shared';
import {
  FlowVersionState,
  Permission,
  PopulatedFlow,
} from '@activepieces/shared';

import { MoveFlowDialog } from '../components/move-flow-dialog';

import { CreateFlowDropdown } from './create-flow-dropdown';
import { flowsApi } from './flows-api';
import { flowsHooks } from './flows-hooks';

export const useFlowsBulkActions = ({
  selectedRows,
  refresh,
  setSelectedRows,
  setRefresh,
  refetch,
}: {
  selectedRows: PopulatedFlow[];
  refresh: number;
  setSelectedRows: (selectedRows: PopulatedFlow[]) => void;
  setRefresh: (refresh: number) => void;
  refetch: () => void;
}) => {
  const userHasPermissionToUpdateFlow = useAuthorization().checkAccess(
    Permission.WRITE_FLOW,
  );
  const userHasPermissionToWriteFolder = useAuthorization().checkAccess(
    Permission.WRITE_FOLDER,
  );
  const userHasPermissionToWriteProjectRelease = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const allowPush = selectedRows.every(
    (flow) =>
      flow.publishedVersionId !== null &&
      flow.version.state === FlowVersionState.LOCKED,
  );
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );
  const isDevelopmentBranch =
    gitSync && gitSync.branchType === GitBranchType.DEVELOPMENT;
  const { mutate: exportFlows, isPending: isExportPending } =
    flowsHooks.useExportFlows();
  return useMemo(() => {
    const showMoveFlow =
      !embedState.hideFolders &&
      (userHasPermissionToUpdateFlow || userHasPermissionToWriteFolder);
    const bulkActions: BulkAction<PopulatedFlow>[] = [
      {
        render: (_, resetSelection) => {
          return (
            <div
              className="flex gap-2 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {userHasPermissionToWriteProjectRelease &&
                allowPush &&
                selectedRows.length > 0 && (
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToWriteProjectRelease}
                  >
                    <PublishedNeededTooltip allowPush={allowPush}>
                      <PushToGitDialog type="flow" flows={selectedRows}>
                        <Button variant="outline">
                          <UploadCloud className="h-4 w-4 mr-2" />
                          {t('Push to Git')}
                        </Button>
                      </PushToGitDialog>
                    </PublishedNeededTooltip>
                  </PermissionNeededTooltip>
                )}

              {showMoveFlow && selectedRows.length > 0 && (
                <PermissionNeededTooltip
                  hasPermission={
                    userHasPermissionToUpdateFlow ||
                    userHasPermissionToWriteFolder
                  }
                >
                  <MoveFlowDialog
                    flows={selectedRows}
                    onMoveTo={() => {
                      setRefresh(refresh + 1);
                      resetSelection();
                      setSelectedRows([]);
                      refetch();
                    }}
                  >
                    <Button variant="outline">
                      <CornerUpLeft className="size-4 mr-2" />
                      {t('Move To')}
                    </Button>
                  </MoveFlowDialog>
                </PermissionNeededTooltip>
              )}

              {selectedRows.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    exportFlows(selectedRows);
                    resetSelection();
                    setSelectedRows([]);
                  }}
                >
                  {isExportPending ? (
                    <LoadingSpinner className="size-4 mr-2" />
                  ) : (
                    <Download className="size-4 mr-2" />
                  )}
                  {isExportPending ? t('Exporting') : t('Export')}
                </Button>
              )}

              {userHasPermissionToUpdateFlow && selectedRows.length > 0 && (
                <PermissionNeededTooltip
                  hasPermission={userHasPermissionToUpdateFlow}
                >
                  <ConfirmationDeleteDialog
                    title={`${t('Delete')} Selected Flows`}
                    message={
                      <>
                        <div>
                          {t(
                            'Are you sure you want to delete these flows? This will permanently delete the flows, all their data and any background runs.',
                          )}
                        </div>
                        {isDevelopmentBranch && (
                          <div className="font-bold mt-2">
                            {t(
                              'You are on a development branch, this will not delete the flows from the remote repository.',
                            )}
                          </div>
                        )}
                      </>
                    }
                    mutationFn={async () => {
                      await Promise.all(
                        selectedRows.map((flow) => flowsApi.delete(flow.id)),
                      );
                      setRefresh(refresh + 1);
                      resetSelection();
                      setSelectedRows([]);
                      refetch();
                    }}
                    entityName={t('flow')}
                  >
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('Delete')}
                    </Button>
                  </ConfirmationDeleteDialog>
                </PermissionNeededTooltip>
              )}
              <CreateFlowDropdown />
            </div>
          );
        },
      },
    ];
    return bulkActions;
  }, [
    userHasPermissionToUpdateFlow,
    userHasPermissionToWriteFolder,
    userHasPermissionToWriteProjectRelease,
    selectedRows,
    refresh,
    allowPush,
    embedState.hideFolders,
    isDevelopmentBranch,
    exportFlows,
    isExportPending,
    setRefresh,
    setSelectedRows,
    refetch,
  ]);
};
