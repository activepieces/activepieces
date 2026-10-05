import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Cpu,
  ExternalLink,
  GitCompareArrows,
  HardDrive,
  MemoryStick,
  Package,
} from 'lucide-react';
import React from 'react';
import semver from 'semver';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { healthQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

import { DailyHealthStrip } from './daily-health-strip';

export function SystemHealthTab() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const {
    data: systemHealth,
    isPending,
    isError,
    refetch,
  } = healthQueries.useSystemHealth();
  const latestVersion = systemHealth?.latestVersion;
  const release = systemHealth?.release;
  const currentVersion = release?.current;

  if (isError) {
    return (
      <>
        <DataFetchErrorState
          entity={t('health checks')}
          onRetry={() => refetch()}
        />
        <DailyHealthStrip />
      </>
    );
  }

  const isVersionUpToDate =
    !!currentVersion &&
    !!latestVersion &&
    semver.valid(currentVersion) !== null &&
    semver.valid(latestVersion) !== null &&
    semver.gte(currentVersion, latestVersion);

  const allAppRows: HealthCheck[] = [
    {
      id: 'version',
      title: t('Version'),
      icon: <Package />,
      status: isPending ? 'loading' : isVersionUpToDate ? 'passed' : 'failed',
      link: RELEASES_LINK,
      message: t('Running {current}, latest is {latest}', {
        current: currentVersion || t('Unknown'),
        latest: latestVersion || t('Unknown'),
      }),
      hiddenOnCloud: true,
    },
    {
      id: 'release-integrity',
      title: t('Release integrity'),
      icon: <GitCompareArrows />,
      status: isPending
        ? 'loading'
        : release &&
          release.current !== UNREADABLE_RELEASE_VERSION &&
          release.workers.versionMismatched === 0
        ? 'passed'
        : 'failed',
      link: CONFIGURATION_LINK,
      message: releaseMessage(release),
      hiddenOnCloud: true,
    },
    {
      id: 'app-disk',
      title: t('Disk'),
      icon: <HardDrive />,
      status: toStatus({ value: systemHealth?.disk, isPending }),
      link: HARDWARE_DOCS_LINK,
      message: t('At least 30GB of disk space is required.'),
    },
    {
      id: 'app-ram',
      title: t('RAM'),
      icon: <MemoryStick />,
      status: toStatus({ value: systemHealth?.appRam, isPending }),
      link: HARDWARE_DOCS_LINK,
      message: t('At least 2GB of RAM is required.'),
    },
    {
      id: 'app-cpu',
      title: t('CPU'),
      icon: <Cpu />,
      status: toStatus({ value: systemHealth?.appCpu, isPending }),
      link: HARDWARE_DOCS_LINK,
      message: t('At least 1 CPU core is required.'),
    },
  ];
  const appRows = allAppRows.filter((row) => !(isCloud && row.hiddenOnCloud));

  const workersConnected = !isNil(systemHealth?.workerRam);
  const workerRows: HealthCheck[] = [
    {
      id: 'worker-ram',
      title: t('RAM'),
      icon: <MemoryStick />,
      status: toStatus({ value: systemHealth?.workerRam, isPending }),
      link: HARDWARE_DOCS_LINK,
      message: workersConnected
        ? t('At least 1GB of RAM is required per worker.')
        : t('No workers are connected.'),
    },
    {
      id: 'worker-cpu',
      title: t('CPU'),
      icon: <Cpu />,
      status: toStatus({ value: systemHealth?.workerCpu, isPending }),
      link: HARDWARE_DOCS_LINK,
      message: workersConnected
        ? t('At least 0.5 CPU core is required per worker.')
        : t('No workers are connected.'),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <CheckPanel
          title={t('App')}
          description={t('API server, UI and webhook routing.')}
          rows={appRows}
        />
        <CheckPanel
          title={t('Workers')}
          description={
            <>
              {t(
                'Machines that run your flows. In production, plan about 10 workers for each app instance.',
              )}{' '}
              <a
                href={PRODUCTION_SETUP_LINK}
                target="_blank"
                rel="noreferrer"
                className="text-gray-12 underline underline-offset-2"
              >
                {t('Production setup')}
              </a>
            </>
          }
          rows={workerRows}
        />
      </div>
      <DailyHealthStrip />
    </>
  );
}

function CheckPanel({
  title,
  description,
  rows,
}: {
  title: string;
  description: React.ReactNode;
  rows: HealthCheck[];
}) {
  return (
    <Panel flush title={title} description={description}>
      <SettingRows>
        {rows.map((row) => (
          <SettingRow
            key={row.id}
            icon={row.icon}
            title={row.title}
            description={row.message}
          >
            <CheckStatus status={row.status} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" asChild>
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('Read the docs')}
                  >
                    <ExternalLink />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Read the docs')}</TooltipContent>
            </Tooltip>
          </SettingRow>
        ))}
      </SettingRows>
    </Panel>
  );
}

function CheckStatus({ status }: { status: CheckState }) {
  const { tone, label, pulse } = CHECK_STATUS[status];
  return (
    <StatusDot tone={tone} pulse={pulse} className="whitespace-nowrap">
      {t(label)}
    </StatusDot>
  );
}

function toStatus({
  value,
  isPending,
}: {
  value: boolean | null | undefined;
  isPending: boolean;
}): CheckState {
  if (isPending || value === undefined) {
    return 'loading';
  }
  if (value === null) {
    return 'na';
  }
  return value ? 'passed' : 'failed';
}

function releaseMessage(release: ReleaseInfo | undefined): React.ReactNode {
  if (!release) {
    return null;
  }
  if (release.current === UNREADABLE_RELEASE_VERSION) {
    return t(
      'The release version could not be read from package.json (reported as 0.0.0). Worker job dispatch is gated and will not recover until the deployment is fixed.',
    );
  }
  if (release.workers.versionMismatched > 0) {
    return t(
      '{count, plural, =1 {# connected worker is running an incompatible version ({versions}). Job dispatch is paused for it until it is upgraded to {current}.} other {# connected workers are running incompatible versions ({versions}). Job dispatch is paused for them until they are upgraded to {current}.}}',
      {
        count: release.workers.versionMismatched,
        versions: release.workers.mismatchedVersions.join(', '),
        current: release.current,
      },
    );
  }
  return t(
    'All {total, plural, =1 {# connected worker matches} other {# connected workers match}} the app release {current}.',
    { total: release.workers.total, current: release.current },
  );
}

const HARDWARE_DOCS_LINK =
  'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications';

const PRODUCTION_SETUP_LINK =
  'https://www.activepieces.com/docs/install/configure-operate/production-setup#what-it-looks-like';

const RELEASES_LINK = 'https://github.com/activepieces/activepieces/releases';

const CONFIGURATION_LINK =
  'https://www.activepieces.com/docs/install/configuration/overview';

const UNREADABLE_RELEASE_VERSION = '0.0.0';

const CHECK_STATUS: Record<
  CheckState,
  {
    tone: 'success' | 'danger' | 'neutral' | 'accent';
    label: string;
    pulse: boolean;
  }
> = {
  passed: { tone: 'success', label: 'Passed', pulse: false },
  failed: { tone: 'danger', label: 'Needs attention', pulse: false },
  na: { tone: 'neutral', label: 'Not applicable', pulse: false },
  loading: { tone: 'accent', label: 'Checking', pulse: true },
};

type CheckState = 'passed' | 'failed' | 'na' | 'loading';

type ReleaseInfo = NonNullable<
  ReturnType<typeof healthQueries.useSystemHealth>['data']
>['release'];

type HealthCheck = {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: CheckState;
  message: React.ReactNode;
  link: string;
  hiddenOnCloud?: boolean;
};
