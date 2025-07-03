import { useMutation } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { ConnectGitDialog } from '@/features/git-sync/components/connect-git-dialog';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  DiffReleaseRequest,
  isNil,
  ProjectReleaseType,
} from '@activepieces/shared';

import { CreateReleaseDialog } from './create-release-dialog';

type ApplyButtonProps = ButtonProps & {
  request: DiffReleaseRequest;
  children: ReactNode;
  onSuccess: () => void;
  defaultName?: string;
};

export const ApplyButton = ({
  request,
  children,
  onSuccess,
  defaultName,
  ...props
}: ApplyButtonProps) => {
  const { toast } = useToast();
  const projectId = authenticationSession.getProjectId()!;
  const { gitSync } = gitSyncHooks.useGitSync(projectId, !isNil(projectId));
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] =
    useState(false);
  const [syncPlan, setSyncPlan] = useState<any>(null);
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  const { mutate: loadSyncPlan } = useMutation({
    mutationFn: (request: DiffReleaseRequest) => {
      setIsCreateReleaseDialogOpen(true);
      return projectReleaseApi.diff(request);
    },
    onSuccess: (plan) => {
      if (
        (!plan.operations || plan.operations.length === 0) &&
        (!plan.tables || plan.tables.length === 0)
      ) {
        setLoadingRequestId(null);
        return;
      }
      setSyncPlan(plan);
      setLoadingRequestId(null);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setLoadingRequestId(null);
    },
  });

  const [isConnectGitDialogOpen, setGitDialogOpen] = useState(false);
  const showGitDialog =
    isNil(gitSync) && request.type === ProjectReleaseType.GIT;
  const requestId = JSON.stringify(request);
  const isLoading = loadingRequestId === requestId;

  return (
    <>
      <Button
        {...props}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (showGitDialog) {
            setGitDialogOpen(true);
          } else {
            setLoadingRequestId(requestId);
            loadSyncPlan(request);
          }
        }}
      >
        {children}
      </Button>

      {isConnectGitDialogOpen ? (
        <ConnectGitDialog
          open={isConnectGitDialogOpen}
          setOpen={setGitDialogOpen}
          showButton={false}
        />
      ) : (
        isCreateReleaseDialogOpen && (
          <CreateReleaseDialog
            open={isCreateReleaseDialogOpen}
            loading={isLoading}
            setOpen={setIsCreateReleaseDialogOpen}
            refetch={onSuccess}
            plan={syncPlan}
            defaultName={defaultName}
            diffRequest={request}
          />
        )
      )}
    </>
  );
};
