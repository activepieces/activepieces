import { useMutation } from '@tanstack/react-query';
import {
  Copy,
  CornerUpLeft,
  Download,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import React from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import { Flow, FlowOperationType, FlowVersion } from '@activepieces/shared';

import { flowsApi } from '../lib/flows-api';
import { flowsUtils } from '../lib/flows-utils';

import { MoveToDialog } from './move-to-dialog';
import { RenameFlowDialog } from './rename-flow-dialog';
import { ShareTemplateDialog } from './share-template-dialog';

interface FlowActionMenuProps {
  flow: Flow;
  flowVersion: FlowVersion;
  children?: React.ReactNode;
  readonly: boolean;
  onRename: (newName: string) => void;
  onMoveTo: (folderId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
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
}) => {
  const { mutate: duplicateFlow, isPending: isDuplicatePending } = useMutation({
    mutationFn: async () => {
      const createdFlow = await flowsApi.create({
        displayName: flowVersion.displayName,
        projectId: authenticationSession.getProjectId(),
      });
      const updatedFlow = await flowsApi.update(createdFlow.id, {
        type: FlowOperationType.IMPORT_FLOW,
        request: {
          displayName: flowVersion.displayName,
          trigger: flowVersion.trigger,
        },
      });
      return updatedFlow;
    },
    onSuccess: (data) => {
      window.open(`/flows/${data.id}`, '_blank', 'rel=noopener noreferrer');
      onDuplicate();
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const { mutate: exportFlow, isPending: isExportPending } = useMutation({
    mutationFn: () => flowsUtils.downloadFlow(flow.id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Flow has been exported.',
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="rounded-full p-2 hover:bg-muted cursor-pointer"
        asChild
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {!readonly && (
          <RenameFlowDialog flowId={flow.id} onRename={onRename}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-row gap-2 items-center">
                <Pencil className="h-4 w-4" />
                <span>Rename</span>
              </div>
            </DropdownMenuItem>
          </RenameFlowDialog>
        )}
        <MoveToDialog flow={flow} flowVersion={flowVersion} onMoveTo={onMoveTo}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div className="flex flex-row gap-2 items-center">
              <CornerUpLeft className="h-4 w-4" />
              <span>Move To</span>
            </div>
          </DropdownMenuItem>
        </MoveToDialog>
        <DropdownMenuItem onClick={() => duplicateFlow()}>
          <div className="flex flex-row gap-2 items-center">
            {isExportPending ? (
              <LoadingSpinner />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{isDuplicatePending ? 'Duplicating' : 'Duplicate'}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportFlow()}>
          <div className="flex flex-row gap-2 items-center">
            {isExportPending ? (
              <LoadingSpinner />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExportPending ? 'Exporting' : 'Export'}</span>
          </div>
        </DropdownMenuItem>
        <ShareTemplateDialog flowId={flow.id} flowVersion={flowVersion}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div className="flex flex-row gap-2 items-center">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </div>
          </DropdownMenuItem>
        </ShareTemplateDialog>
        {!readonly && (
          <ConfirmationDeleteDialog
            title={`Delete flow ${flowVersion.displayName}`}
            message="Are you sure you want to delete this flow? This will permanently delete the flow, all its data and any background runs."
            mutationFn={async () => {
              await flowsApi.delete(flow.id);
              onDelete();
            }}
            entityName={'flow'}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-row gap-2 items-center">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Delete</span>
              </div>
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FlowActionMenu;
