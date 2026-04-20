import { t } from 'i18next';
import { toast } from 'sonner';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ConnectGitDialog,
  gitSyncHooks,
  gitSyncMutations,
} from '@/features/project-releases';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { ReleaseCard } from './release-card';

const EnvironmentSettings = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { gitSync, isLoading, refetch } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );

  const { mutate } = gitSyncMutations.useDisconnectGitSync({
    onSuccess: () => {
      refetch();
      toast.success(t('Git Connection Removed'), {
        duration: 3000,
      });
    },
  });

  return (
    <LockedFeatureGuard
      featureKey="ENVIRONMENT"
      locked={!platform.plan.environmentsEnabled}
      lockTitle={t('Enable Environments')}
      lockDescription={t(
        'Deploy flows across development, staging and production environments with version control and team collaboration',
      )}
    >
      <div className="flex w-full flex-col items-start justify-center gap-4">
        <Card className="w-full p-4">
          <div className="flex w-full">
            {!isLoading && (
              <>
                <div className="flex grow flex-col gap-2">
                  <p>
                    {t('Repository URL')}:{' '}
                    {gitSync?.remoteUrl ?? t('Not connected')}
                  </p>
                  <p>
                    {t('Branch')}: {gitSync?.branch ?? t('Not connected')}
                  </p>
                  <p>
                    {t('Project Folder')}: {gitSync?.slug ?? t('Not connected')}
                  </p>
                </div>
                <div className="flex flex-col justify-center items-center gap-2">
                  {!gitSync && (
                    <ConnectGitDialog showButton={true}></ConnectGitDialog>
                  )}
                  {gitSync && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size={'sm'}
                        onClick={() => gitSync && mutate(gitSync.id)}
                        className="w-32 text-destructive"
                        variant={'basic'}
                      >
                        {t('Disconnect')}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
            {isLoading && (
              <div className="flex grow justify-center items-center">
                <LoadingSpinner className="size-5"></LoadingSpinner>
              </div>
            )}
          </div>
        </Card>
        <ReleaseCard />
      </div>
    </LockedFeatureGuard>
  );
};

export { EnvironmentSettings };
