import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Cpu, HardDrive, MemoryStick, Package } from 'lucide-react';
import React from 'react';
import semver from 'semver';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { flagsHooks } from '@/hooks/flags-hooks';
import { healthApi } from '@/lib/health-api';
import { ApFlagId, ApVersion, isNil } from '@activepieces/shared';

import { CheckItem } from './check-item';

export default function SettingsHealthPage() {
  const { data: currentVersion } = flagsHooks.useFlag<ApVersion>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: latestVersion } = flagsHooks.useFlag<ApVersion>(
    ApFlagId.LATEST_VERSION,
  );
  const { data: systemHealth, isPending } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthApi.getSystemHealthChecks(),
  });

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion.version, latestVersion.version);
  }, [currentVersion, latestVersion]);

  const rcVersion = React.useMemo(() => {
    if (isNil(currentVersion?.rcVersion)) return null;
    return `${currentVersion.version}-rc.${currentVersion.rcVersion}`;
  }, [currentVersion]);

  const technicalChecks = [
    {
      id: 'version',
      title: t('Version Check'),
      icon: <Package />,
      isChecked: isVersionUpToDate,
      message: (
        <VersionMessage
          rcVersion={rcVersion}
          currentVersion={currentVersion}
          latestVersion={latestVersion}
          isVersionUpToDate={isVersionUpToDate}
        />
      ),
      link: 'https://github.com/activepieces/activepieces/releases',
    },
    {
      id: 'disk-size',
      title: t('Disk Size'),
      icon: <HardDrive />,
      isChecked: systemHealth?.disk,
      message: systemHealth?.disk
        ? t('Minimum amount of disk space is available')
        : t('Minimum 30GB of disk space is required'),
      loading: isPending,
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
    },
    {
      id: 'ram',
      title: t('RAM'),
      icon: <MemoryStick />,
      isChecked: systemHealth?.ram,
      message: systemHealth?.ram
        ? t('Minimum amount of RAM is available')
        : t('Minimum 4GB of RAM is required'),
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
    {
      id: 'cpu',
      title: t('CPU Cores'),
      icon: <Cpu />,
      isChecked: systemHealth?.cpu,
      message: systemHealth?.cpu
        ? t('Minimum amount of CPU cores is available')
        : t('Minimum 1 CPU core is required'),
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

const VersionMessage = ({
  rcVersion,
  currentVersion,
  latestVersion,
  isVersionUpToDate,
}: {
  rcVersion: string | null;
  currentVersion: ApVersion | null;
  latestVersion: ApVersion | null;
  isVersionUpToDate: boolean;
}) => {
  return (
    <>
      <div>
        <b>Current</b>:{' '}
        {rcVersion ? (
          <span className="text-warning-300">
            {rcVersion} (Release Candidate)
          </span>
        ) : (
          <span>{currentVersion?.version || 'Unknown'}</span>
        )}
      </div>
      <div>
        <b>Latest</b>: {latestVersion?.version || 'Unknown'}
      </div>
      {!isVersionUpToDate && (
        <p>
          Upgrade now to enjoy the latest features and bug fixes.
          <br />
          Check the changelog{' '}
          <a
            className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
            href="https://github.com/activepieces/activepieces/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            releases
          </a>
          .
        </p>
      )}
    </>
  );
};
