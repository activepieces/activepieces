import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ProjectReleaseType, DiffReleaseRequest } from '@activepieces/shared';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { CreateReleaseDialog } from './create-release-dialog';
import { Button, ButtonProps } from '@/components/ui/button';
import { ReactNode } from 'react';

type ApplyButtonProps = ButtonProps & {
  request: DiffReleaseRequest;
  children: ReactNode;
};

export const useApplyPlan = ({ onSuccess }: { onSuccess: () => void }) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncPlan, setSyncPlan] = useState<any>(null);
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  const { mutate: loadSyncPlan } = useMutation({
    mutationFn: (request: DiffReleaseRequest) => projectReleaseApi.diff(request),
    onSuccess: (plan) => {
      setSyncPlan(plan);
      setDialogOpen(true);
      setLoadingRequestId(null);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setLoadingRequestId(null);
    },
  });

  const ApplyPlanDialog = () => (
    dialogOpen && (
      <CreateReleaseDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        refetch={onSuccess}
        plan={syncPlan}
      />
    )
  );

  const ApplyButton = ({ request, children, ...props }: ApplyButtonProps) => {
    const requestId = JSON.stringify(request);
    const isLoading = loadingRequestId === requestId;

    return (
      <Button
        {...props}
        loading={isLoading}
        onClick={() => {
          setLoadingRequestId(requestId);
          loadSyncPlan(request);
        }}
      >
        {children}
      </Button>
    );
  };

  return {
    ApplyPlanDialog,
    ApplyButton,
  };
}; 