import { t } from 'i18next';
import {
  ChevronDown,
  CornerUpLeft,
  Download,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useMemo } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { BulkAction } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
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

import { flowsApi } from './flows-api';
import { flowsHooks } from './flows-hooks';

// TODO: this should be divded to more components
export const useFlowsBulkActions = ({
  selectedRows,
  isDropdownOpen,
  setIsDropdownOpen,
  refresh,
  setSelectedRows,
  setRefresh,
  refetch,
}: {
  selectedRows: PopulatedFlow[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isDropdownOpen: boolean) => void;
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
  const userHasPermissionToWroteProjectRelease = useAuthorization().checkAccess(
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
    platform.environmentsEnabled,
  );
  const isDevelopmentBranch =
    gitSync && gitSync.branchType === GitBranchType.DEVELOPMENT;
  const { mutate: exportFlows, isPending: isExportPending } =
    flowsHooks.useExportFlows();
  return useMemo(() => {
    const bulkActions: BulkAction<PopulatedFlow>[] = [
      {
        render: (_, resetSelection) => {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                modal={true}
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
              >
                {selectedRows.length > 0 ? (
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-9 w-full"
                      variant={'default'}
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                    >
                      {selectedRows.length > 0
                        ? `${t('Actions')} (${selectedRows.length})`
                        : t('Actions')}
                      <ChevronDown className="h-3 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                ) : null}

                <DropdownMenuContent>
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToWroteProjectRelease}
                  >
                    <PublishedNeededTooltip allowPush={allowPush}>
                      <PushToGitDialog type="flow" flows={selectedRows}>
                        <DropdownMenuItem
                          disabled={
                            !userHasPermissionToWroteProjectRelease ||
                            !allowPush
                          }
                          onSelect={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <div className="flex cursor-pointer  flex-row gap-2 items-center">
                            <UploadCloud className="h-4 w-4" />
                            <span>{t('Push to Git')}</span>
                          </div>
                        </DropdownMenuItem>
                      </PushToGitDialog>
                    </PublishedNeededTooltip>
                  </PermissionNeededTooltip>
                  {!embedState.hideFolders && (
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
                          setIsDropdownOpen(false);
                        }}
                      >
                        <DropdownMenuItem
                          disabled={
                            !userHasPermissionToUpdateFlow ||
                            !userHasPermissionToWriteFolder
                          }
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex cursor-pointer  flex-row gap-2 items-center">
                            <CornerUpLeft className="h-4 w-4" />
                            <span>{t('Move To')}</span>
                          </div>
                        </DropdownMenuItem>
                      </MoveFlowDialog>
                    </PermissionNeededTooltip>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      exportFlows(selectedRows);
                      resetSelection();
                      setSelectedRows([]);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex cursor-pointer flex-row gap-2 items-center">
                      {isExportPending ? (
                        <LoadingSpinner />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>
                        {isExportPending ? t('Exporting') : t('Export')}
                      </span>
                    </div>
                  </DropdownMenuItem>
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
                        setIsDropdownOpen(false);
                      }}
                      entityName={t('flow')}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToUpdateFlow}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex cursor-pointer  flex-row gap-2 items-center">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">
                            {t('Delete')}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </ConfirmationDeleteDialog>
                  </PermissionNeededTooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
    return bulkActions;
  }, [userHasPermissionToUpdateFlow, selectedRows, refresh, isDropdownOpen]);
};
