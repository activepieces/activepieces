import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Cpu,
  GitCompareArrows,
  HardDrive,
  MemoryStick,
  Package,
} from 'lucide-react';
import React from 'react';
import semver from 'semver';

import { healthQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

import { CheckItem } from './check-item';
import { DailyHealthStrip } from './daily-health-strip';

type SystemHealthTabProps = {
  onSeeRuns: () => void;
};

export function SystemHealthTab({ onSeeRuns }: SystemHealthTabProps) {
  const { data: currentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: latestVersion } = flagsHooks.useFlag<string>(
    ApFlagId.LATEST_VERSION,
  );
  const { data: systemHealth, isPending } = healthQueries.useSystemHealth();

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion, latestVersion);
  }, [currentVersion, latestVersion]);

  const release = systemHealth?.release;
  const releaseIntegrityOk =
    !!release?.readOk && release?.workers.versionMismatched === 0;
  const releaseIntegrityMessage = (() => {
    if (!release) {
      return null;
    }
    if (!release.readOk) {
      return (
        <span>
          {t(
            'The release version could not be read from package.json (reported as 0.0.0). Worker job dispatch is gated and will not recover until the deployment is fixed.',
          )}
        </span>
      );
    }
    if (release.workers.versionMismatched > 0) {
      return (
        <span>
          {t(
            '{count, plural, =1 {# connected worker is running an incompatible version ({versions}). Job dispatch is paused for it until it is upgraded to {current}.} other {# connected workers are running incompatible versions ({versions}). Job dispatch is paused for them until they are upgraded to {current}.}}',
            {
              count: release.workers.versionMismatched,
              versions: release.workers.mismatchedVersions.join(', '),
              current: release.current,
            },
          )}
        </span>
      );
    }
    return (
      <span>
        {t(
          'All {total, plural, =1 {# connected worker matches} other {# connected workers match}} the app release {current}.',
          { total: release.workers.total, current: release.current },
        )}
      </span>
    );
  })();

  const technicalChecks = [
    {
      id: 'version',
      title: t('Version Check'),
      icon: <Package />,
      isChecked: isVersionUpToDate,
      message: (
        <div>
          <div className="flex flex-row gap-4 items-center">
            <span>
              <b>{t('Current Version')}</b>: {currentVersion || t('Unknown')}
            </span>
            <span>
              <b>{t('Latest Version')}</b>: {latestVersion || t('Unknown')}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {!isVersionUpToDate ? (
              <>
                <span>
                  {t(
                    'A new version is available. Upgrade now to enjoy the latest features, improvements, and bug fixes.',
                  )}
                </span>
                <span>
                  {t('See the')}{' '}
                  <a
                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    href="https://github.com/activepieces/activepieces/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('release changelog')}
                  </a>
                  .
                </span>
              </>
            ) : null}
          </div>
        </div>
      ),
      link: 'https://github.com/activepieces/activepieces/releases',
    },
    {
      id: 'release-integrity',
      title: t('Release Integrity'),
      icon: <GitCompareArrows />,
      isChecked: releaseIntegrityOk,
      message: releaseIntegrityMessage,
      loading: isPending,
      link: 'https://www.activepieces.com/docs/install/configuration/overview',
    },
    {
      id: 'disk-size',
      title: t('Disk Size'),
      icon: <HardDrive />,
      isChecked: systemHealth?.disk,
      message: (
        <span>
          {systemHealth?.disk
            ? t(
                'The server has sufficient disk space. At least 30GB of disk space is required for optimal operation.',
              )
            : t(
                'Insufficient disk space. A minimum of 30GB is required for Activepieces to function properly.',
              )}
        </span>
      ),
      loading: isPending,
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
    },
    {
      id: 'ram',
      title: t('RAM'),
      icon: <MemoryStick />,
      isChecked: systemHealth?.ram,
      message: (
        <span>
          {systemHealth?.ram
            ? t(
                'The server meets the minimum RAM requirement. At least 4GB RAM is needed for stable performance.',
              )
            : t(
                'Insufficient RAM. A minimum of 4GB RAM is required for optimal operation.',
              )}
        </span>
      ),
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
    {
      id: 'cpu',
      title: t('CPU Cores'),
      icon: <Cpu />,
      isChecked: systemHealth?.cpu,
      message: (
        <span>
          {systemHealth?.cpu
            ? t(
                'The server has enough CPU resources. At least 1 CPU core is required to run Activepieces.',
              )
            : t(
                'Not enough CPU resources. At least 1 CPU core is necessary to operate Activepieces.',
              )}
        </span>
      ),
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {technicalChecks.map((check) => (
        <CheckItem
          key={check.id}
          id={check.id}
          title={check.title}
          isChecked={check.isChecked ?? false}
          message={check.message}
          loading={check.loading ?? false}
          link={check.link}
          icon={check.icon}
        />
      ))}
      <DailyHealthStrip onSeeRuns={onSeeRuns} />
    </div>
  );
}
