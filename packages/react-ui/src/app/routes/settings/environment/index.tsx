import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { ConnectGitDialog } from '@/features/git-sync/components/connect-git-dialog';
import { gitSyncApi } from '@/features/git-sync/lib/git-sync-api';
import { gitSyncHooks } from '@/features/git-sync/lib/git-sync-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { assertNotNullOrUndefined } from '@activepieces/shared';

import { ReleaseCard } from './release-card';

const EnvironmentPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { gitSync, isLoading, refetch } = gitSyncHooks.useGitSync(
    authenticationSession.getProjectId()!,
    platform.plan.environmentsEnabled,
  );

  const { mutate } = useMutation({
    mutationFn: () => {
      assertNotNullOrUndefined(gitSync, 'gitSync');
      return gitSyncApi.disconnect(gitSync.id);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: t('Git Connection Removed'),
        description: t(
          'Your Git repository has been successfully disconnected',
        ),
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
        <DashboardPageHeader
          title={t('Environments')}
          description={
            <span className="text-muted-foreground text-md">
              {t(
                'Connect to Git to enable version control, backup your flows, and manage multiple environments. ',
              )}
              <a
                href="https://www.activepieces.com/docs/operations/git-sync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('Environments & Releases')}
              </a>
            </span>
          }
        />
        <Card className="w-full p-4">
          <div className="flex w-full">
            {!isLoading && (
              <>
                <div className="flex flex-grow flex-col gap-2">
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
                        onClick={() => mutate()}
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
              <div className="flex flex-grow justify-center items-center">
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

export { EnvironmentPage };
