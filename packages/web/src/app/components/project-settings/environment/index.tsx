import { t } from 'i18next';
import { toast } from 'sonner';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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
      lockTitle={t('Environments and releases')}
      lockDescription={t(
        'Keep flows in a Git repository and move them between development, staging and production as releases you can roll back.',
      )}
    >
      <div className="flex flex-col gap-4">
        <Panel>
          {isLoading ? (
            <div className="flex justify-center">
              <Spinner className="text-gray-11" />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex min-w-0 grow flex-col gap-1">
                <p className="truncate">
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
              {!gitSync && (
                <ConnectGitDialog showButton={true}></ConnectGitDialog>
              )}
              {gitSync && (
                <Button
                  size="sm"
                  onClick={() => gitSync && mutate(gitSync.id)}
                  className="text-danger-11"
                  variant="ghost"
                >
                  {t('Disconnect')}
                </Button>
              )}
            </div>
          )}
        </Panel>
        <ReleaseCard />
      </div>
    </LockedFeatureGuard>
  );
};

export { EnvironmentSettings };
