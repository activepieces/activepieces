import { Permission, PopulatedFlow } from '@activepieces/shared';
import { t } from 'i18next';
import { CornerUpLeft, Download, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { MoveFlowDialog } from '../components/move-flow-dialog';

import { flowsApi } from './flows-api';
import { flowsHooks } from './flows-hooks';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { BulkAction } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/spinner';
import { useAuthorization } from '@/hooks/authorization-hooks';

// TODO: this should be divded to more components
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
  const { embedState } = useEmbedding();
  const { mutate: exportFlows, isPending: isExportPending } =
    flowsHooks.useExportFlows();
  return useMemo(() => {
    const bulkActions: BulkAction<PopulatedFlow>[] = [
      {
        render: (_, resetSelection) => {
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {!embedState.hideFolders &&
                (userHasPermissionToUpdateFlow ||
                  userHasPermissionToWriteFolder) &&
                selectedRows.length > 0 && (
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
                      <Button variant="outline" size="sm">
                        <CornerUpLeft className="size-4 mr-2" />
                        {t('Move To')}
                      </Button>
                    </MoveFlowDialog>
                  </PermissionNeededTooltip>
                )}

              {selectedRows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
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
                      <div>
                        {t(
                          'Are you sure you want to delete these flows? This will permanently delete the flows, all their data and any background runs.',
                        )}
                      </div>
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
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('Delete')}
                    </Button>
                  </ConfirmationDeleteDialog>
                </PermissionNeededTooltip>
              )}
            </div>
          );
        },
      },
    ];
    return bulkActions;
  }, [
    userHasPermissionToUpdateFlow,
    userHasPermissionToWriteFolder,
    selectedRows,
    refresh,
    embedState.hideFolders,
    exportFlows,
    isExportPending,
    setRefresh,
    setSelectedRows,
    refetch,
  ]);
};
