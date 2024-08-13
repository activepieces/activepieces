import { useMutation } from '@tanstack/react-query';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { ConnectGitDialog } from '@/features/git-sync/components/connect-git-dialog';
import { ReviewChangeDialog } from '@/features/git-sync/components/review-change-dialog';
import { gitSyncApi } from '@/features/git-sync/lib/git-sync-api';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

const GitSyncPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { gitSync, isLoading, refetch } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId(),
    platform.gitSyncEnabled,
  );

  const { mutate } = useMutation({
    mutationFn: () => gitSyncApi.disconnect(gitSync?.id!),
    onSuccess: () => {
      refetch();
      toast({
        title: 'Git Sync Disconnected',
        description: 'You have successfully disconnected your Git Sync',
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <LockedFeatureGuard
      locked={!platform.gitSyncEnabled}
      lockTitle="Unlock Git Sync"
      lockDescription="Streamline your team's workflow for a seamless experience to build and deploy flows across your environments"
    >
      <div className="flex w-full flex-col items-start justify-center gap-4">
        <div className="flex flex-col justify-start items-start w-full">
          <h1 className="text-2xl font-bold flex-grow">Git Sync</h1>
          <span className="text-muted-foreground text-md">
            This feature allows for the creation of an external backup,
            environments, and maintaining a version history
          </span>
        </div>
        <Card className="w-full p-4">
          <div className="flex w-full">
            {!isLoading && (
              <>
                <div className="flex flex-grow flex-col gap-2">
                  <p>Remote URL: {gitSync?.remoteUrl ?? 'Not Connected'}</p>
                  <p>Branch: {gitSync?.branch ?? 'Not Connected'}</p>
                  <p>Folder: {gitSync?.slug ?? 'Not Connected'}</p>
                </div>
                <div className="flex flex-col justify-center items-center gap-2">
                  {!gitSync && <ConnectGitDialog></ConnectGitDialog>}
                  {gitSync && (
                    <Button
                      size={'sm'}
                      onClick={() => mutate()}
                      className="w-32 text-destructive"
                      variant={'basic'}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </>
            )}
            {isLoading && (
              <div className="flex flex-grow justify-center items-center">
                <LoadingSpinner className="w-5 h-5"></LoadingSpinner>
              </div>
            )}
          </div>
        </Card>
        <div className="flex w-full">
          {gitSync && (
            <ReviewChangeDialog gitSync={gitSync}></ReviewChangeDialog>
          )}
        </div>
      </div>
    </LockedFeatureGuard>
  );
};

export { GitSyncPage };
