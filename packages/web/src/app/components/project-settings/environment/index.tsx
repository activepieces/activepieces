import { t } from 'i18next';
import { toast } from 'sonner';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
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
      toast.success(t('Git disconnected'), {
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
        <Panel
          flush
          title={t('Git repository')}
          description={t(
            'Flows are pushed to and pulled from this repository.',
          )}
          action={
            isLoading ? null : gitSync ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate(gitSync.id)}
              >
                {t('Disconnect')}
              </Button>
            ) : (
              <ConnectGitDialog showButton={true} />
            )
          }
        >
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Spinner className="text-gray-11" />
            </div>
          ) : (
            <SettingRows>
              <SettingRow title={t('Repository URL')}>
                <GitValue value={gitSync?.remoteUrl} />
              </SettingRow>
              <SettingRow title={t('Branch')}>
                <GitValue value={gitSync?.branch} />
              </SettingRow>
              <SettingRow title={t('Project folder')}>
                <GitValue value={gitSync?.slug} />
              </SettingRow>
            </SettingRows>
          )}
        </Panel>
        <ReleaseCard />
      </div>
    </LockedFeatureGuard>
  );
};

const GitValue = ({ value }: { value: string | undefined }) => (
  <span className="max-w-72 truncate font-mono text-sm text-gray-11">
    {value ?? t('Not connected')}
  </span>
);

export { EnvironmentSettings };
