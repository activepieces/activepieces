import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Cpu, HardDrive, MemoryStick, Package } from 'lucide-react';
import React from 'react';
import semver from 'semver';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { flagsHooks } from '@/hooks/flags-hooks';
import { healthApi } from '@/lib/health-api';
import { ApFlagId } from '@activepieces/shared';

import { CheckItem } from './check-item';

export default function SettingsHealthPage() {
  const { data: currentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: latestVersion } = flagsHooks.useFlag<string>(
    ApFlagId.LATEST_VERSION,
  );
  const { data: systemHealth, isPending } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthApi.getSystemHealthChecks(),
  });

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion, latestVersion);
  }, [currentVersion, latestVersion]);

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
    <div className="flex flex-col w-full gap-4">
      <DashboardPageHeader
        title={t('System Health Status')}
        description={t('Check the status of your platform and its components')}
      />
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
    </div>
  );
}
