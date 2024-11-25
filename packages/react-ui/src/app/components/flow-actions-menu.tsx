import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Copy,
  CornerUpLeft,
  Download,
  Import,
  Pencil,
  Share2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import React from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useEmbedding, useNewWindow } from '@/components/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  ImportFlowDialog,
  ImportFlowDialogProps,
} from '@/features/flows/components/import-flow-dialog';
import { PushToGitDialog } from '@/features/git-sync/components/push-to-git-dialog';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { GitBranchType } from '@activepieces/ee-shared';
import {
  Flow,
  FlowOperationType,
  FlowVersion,
  Permission,
} from '@activepieces/shared';

import { MoveFlowDialog } from '../../features/flows/components/move-flow-dialog';
import { RenameFlowDialog } from '../../features/flows/components/rename-flow-dialog';
import { ShareTemplateDialog } from '../../features/flows/components/share-template-dialog';
import { flowsApi } from '../../features/flows/lib/flows-api';
import { flowsUtils } from '../../features/flows/lib/flows-utils';

interface FlowActionMenuProps {
  flow: Flow;
  flowVersion: FlowVersion;
  children?: React.ReactNode;
  readonly: boolean;
  onRename: (newName: string) => void;
  onMoveTo: (folderId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  insideBuilder: boolean;
}

const FlowActionMenu: React.FC<FlowActionMenuProps> = ({
  flow,
  flowVersion,
  children,
  readonly,
  onRename,
  onMoveTo,
  onDuplicate,
  onDelete,
  insideBuilder,
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const openNewWindow = useNewWindow();
  const { gitSync } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.gitSyncEnabled,
  );
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToPushToGit = checkAccess(Permission.WRITE_GIT_REPO);
  const importFlowProps: ImportFlowDialogProps = {
    insideBuilder: true,
    flowId: flow.id,
  };
  const { embedState } = useEmbedding();
  const isDevelopmentBranch =
    gitSync && gitSync.branchType === GitBranchType.DEVELOPMENT;

  const { mutate: duplicateFlow, isPending: isDuplicatePending } = useMutation({
    mutationFn: async () => {
      const createdFlow = await flowsApi.create({
        displayName: flowVersion.displayName,
        projectId: authenticationSession.getProjectId()!,
      });
      const updatedFlow = await flowsApi.update(createdFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: flowVersion.displayName,
          trigger: flowVersion.trigger,
          schemaVersion: flowVersion.schemaVersion,
        },
      });
      return updatedFlow;
    },
    onSuccess: (data) => {
      openNewWindow(`/flows/${data.id}`);
      onDuplicate();
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const { mutate: exportFlow, isPending: isExportPending } = useMutation({
    mutationFn: () => flowsUtils.downloadFlow(flow.id),
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Flow has been exported.'),
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger
        className="rounded-full p-2 hover:bg-muted cursor-pointer"
        asChild
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {!readonly && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFlow}
          >
            <RenameFlowDialog flowId={flow.id} onRename={onRename}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                disabled={!userHasPermissionToUpdateFlow}
              >
                <div className="flex cursor-pointer flex-row gap-2 items-center">
                  <Pencil className="h-4 w-4" />
                  <span>{t('Rename')}</span>
                </div>
              </DropdownMenuItem>
            </RenameFlowDialog>
          </PermissionNeededTooltip>
        )}
        <PermissionNeededTooltip hasPermission={userHasPermissionToPushToGit}>
          <PushToGitDialog flowIds={[flow.id]}>
            <DropdownMenuItem
              disabled={!userHasPermissionToPushToGit}
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex cursor-pointer  flex-row gap-2 items-center">
                <UploadCloud className="h-4 w-4" />
                <span>{t('Push to Git')}</span>
              </div>
            </DropdownMenuItem>
          </PushToGitDialog>
        </PermissionNeededTooltip>

        {!embedState.hideFolders && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFlow}
          >
            <MoveFlowDialog flows={[flow]} onMoveTo={onMoveTo}>
              <DropdownMenuItem
                disabled={!userHasPermissionToUpdateFlow}
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
        <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateFlow}>
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

        {!readonly && insideBuilder && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToUpdateFlow}
          >
            <ImportFlowDialog {...importFlowProps}>
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
        <DropdownMenuItem onClick={() => exportFlow()}>
          <div className="flex cursor-pointer  flex-row gap-2 items-center">
            {isExportPending ? (
              <LoadingSpinner />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExportPending ? t('Exporting') : t('Export')}</span>
          </div>
        </DropdownMenuItem>
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
                  <>
                    <div>
                      {t(
                        'Are you sure you want to delete this flow? This will permanently delete the flow, all its data and any background runs.',
                      )}
                    </div>
                    {isDevelopmentBranch && (
                      <div className="font-bold mt-2">
                        {t(
                          'You are on a development branch, this will not delete the flow from the remote repository.',
                        )}
                      </div>
                    )}
                  </>
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
