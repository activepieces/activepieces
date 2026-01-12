import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Copy,
  CornerUpLeft,
  Download,
  GalleryVerticalEnd,
  Import,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding } from '@/components/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { RenameFlowDialog } from '@/features/flows/components/rename-flow-dialog';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import {
  FlowOperationType,
  FlowVersion,
  Permission,
  PopulatedFlow,
} from '@activepieces/shared';

import { MoveFlowDialog } from '../../features/flows/components/move-flow-dialog';
import { ShareTemplateDialog } from '../../features/flows/components/share-template-dialog';

type FlowActionMenuProps = {
  flow: PopulatedFlow;
  flowVersion: FlowVersion;
  children?: React.ReactNode;
  readonly: boolean;
  onRename: () => void;
  onMoveTo: (folderId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
} & (
  | { insideBuilder: true; onVersionsListClick: () => void }
  | { insideBuilder: false; onVersionsListClick: null }
);

const FlowActionMenu: React.FC<FlowActionMenuProps> = ({
  flow,
  flowVersion,
  children,
  readonly,
  onRename,
  onMoveTo,
  onDuplicate,
  onDelete,
  onVersionsListClick,
  insideBuilder,
}) => {
  const isRunsPage = useLocation().pathname.includes('/runs');
  const openNewWindow = useNewWindow();
  // Git sync removed (EE feature)
  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFolder = checkAccess(Permission.WRITE_FOLDER);
  const userHasPermissionToUpdateFlow = checkAccess(Permission.WRITE_FLOW);

  const { embedState } = useEmbedding();
  const [open, setOpen] = useState(false);

  const { mutate: duplicateFlow, isPending: isDuplicatePending } = useMutation({
    mutationFn: async () => {
      const modifiedFlowVersion = {
        ...flowVersion,
        displayName: `${flowVersion.displayName} - Copy`,
      };
      const createdFlow = await flowsApi.create({
        displayName: modifiedFlowVersion.displayName,
        projectId: authenticationSession.getProjectId()!,
        folderId: flow.folderId ?? undefined,
      });
      const updatedFlow = await flowsApi.update(createdFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: modifiedFlowVersion.displayName,
          trigger: modifiedFlowVersion.trigger,
          schemaVersion: modifiedFlowVersion.schemaVersion,
        },
      });
      return updatedFlow;
    },
    onSuccess: (data) => {
      openNewWindow(`/flows/${data.id}`);
      onDuplicate();
    },
  });

  const { mutate: exportFlow, isPending: isExportPending } =
    flowHooks.useExportFlows();
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        noAnimationOnOut={true}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {!readonly && (
          <>
            {insideBuilder && (
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateFlow}
              >
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    onRename();
                  }}
                  disabled={!userHasPermissionToUpdateFlow}
                >
                  <div className="flex cursor-pointer flex-row gap-2 items-center">
                    <Pencil className="h-4 w-4" />
                    <span>{t('Rename')}</span>
                  </div>
                </DropdownMenuItem>
              </PermissionNeededTooltip>
            )}

            {!insideBuilder && (
              <RenameFlowDialog
                flowId={flow.id}
                onRename={onRename}
                flowName={flowVersion.displayName}
              >
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!userHasPermissionToUpdateFlow}
                >
                  <div className="flex cursor-pointer flex-row gap-2 items-center">
                    <Pencil className="h-4 w-4" />
                    <span>{t('Rename')}</span>
                  </div>
                </DropdownMenuItem>
              </RenameFlowDialog>
            )}
          </>
        )}

        {/* Push to Git removed (EE feature) */}

        {!embedState.hideFolders && (
          <PermissionNeededTooltip
            hasPermission={
              userHasPermissionToUpdateFlow || userHasPermissionToWriteFolder
            }
          >
            <MoveFlowDialog flows={[flow]} onMoveTo={onMoveTo}>
              <DropdownMenuItem
                disabled={
                  !userHasPermissionToUpdateFlow ||
                  !userHasPermissionToWriteFolder
                }
                onSelect={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex cursor-pointer  flex-row gap-2 items-center">
                  <CornerUpLeft className="h-4 w-4" />
                  <span>{t('Move To')}</span>
                </div>
              </DropdownMenuItem>
            </MoveFlowDialog>
          </PermissionNeededTooltip>
        )}
        {!embedState.hideDuplicateFlow && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFlow}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateFlow}
              onClick={() => duplicateFlow()}
            >
              <div className="flex cursor-pointer  flex-row gap-2 items-center">
                {isDuplicatePending ? (
                  <LoadingSpinner />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>
                  {isDuplicatePending ? t('Duplicating') : t('Duplicate')}
                </span>
              </div>
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {insideBuilder && !isRunsPage && (
          <DropdownMenuItem onClick={onVersionsListClick}>
            <div className="flex cursor-pointer  flex-row gap-2 items-center">
              <GalleryVerticalEnd className="h-4 w-4" />
              <span>{t('Versions')}</span>
            </div>
          </DropdownMenuItem>
        )}
        {!readonly && insideBuilder && !embedState.hideExportAndImportFlow && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFlow}
          >
            <ImportFlowDialog insideBuilder={true} flowId={flow.id}>
              <DropdownMenuItem
                disabled={!userHasPermissionToUpdateFlow}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex cursor-pointer flex-row gap-2 items-center">
                  <Import className="w-4 h-4" />
                  {t('Import')}
                </div>
              </DropdownMenuItem>
            </ImportFlowDialog>
          </PermissionNeededTooltip>
        )}

        {!embedState.hideExportAndImportFlow && (
          <DropdownMenuItem onClick={() => exportFlow([flow])}>
            <div className="flex cursor-pointer  flex-row gap-2 items-center">
              {isExportPending ? (
                <LoadingSpinner />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExportPending ? t('Exporting') : t('Export')}</span>
            </div>
          </DropdownMenuItem>
        )}
        {!embedState.isEmbedded && (
          <ShareTemplateDialog flowId={flow.id} flowVersionId={flowVersion.id}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex cursor-pointer  flex-row gap-2 items-center">
                <Share2 className="h-4 w-4" />
                <span>{t('Share')}</span>
              </div>
            </DropdownMenuItem>
          </ShareTemplateDialog>
        )}
        {!readonly &&
          (!embedState.isEmbedded ||
            !embedState.disableNavigationInBuilder ||
            !insideBuilder) && (
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToUpdateFlow}
            >
              <ConfirmationDeleteDialog
                title={`${t('Delete')} ${flowVersion.displayName}`}
                message={
                  <div>
                    {t(
                      'Are you sure you want to delete this flow? This will permanently delete the flow, all its data and any background runs.',
                    )}
                  </div>
                }
                mutationFn={async () => {
                  await flowsApi.delete(flow.id);
                  onDelete();
                }}
                entityName={t('flow')}
              >
                <DropdownMenuItem
                  disabled={!userHasPermissionToUpdateFlow}
                  onSelect={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{t('Delete')}</span>
                  </div>
                </DropdownMenuItem>
              </ConfirmationDeleteDialog>
            </PermissionNeededTooltip>
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FlowActionMenu;
