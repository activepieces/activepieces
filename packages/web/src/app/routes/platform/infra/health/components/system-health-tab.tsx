import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Boxes,
  Cpu,
  ExternalLink,
  GitCompareArrows,
  HardDrive,
  Info,
  MemoryStick,
  Package,
  Server,
} from 'lucide-react';
import React from 'react';
import semver from 'semver';

import {
  SettingsPanel,
  SettingsRow,
  StatusDot,
  StatusTone,
} from '@/app/components/admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { healthQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { DailyHealthStrip } from './daily-health-strip';

const HARDWARE_DOCS_LINK =
  'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications';

// Matches UNKNOWN_VERSION in @activepieces/server-utils: the sentinel the backend reports when
// it could not read its release from package.json. Not importable here (server-only package).
const UNREADABLE_RELEASE_VERSION = '0.0.0';

const CLOUD_HIDDEN_ROW_IDS = ['version', 'release-integrity'];

type SystemHealthTabProps = {
  onSeeRuns: () => void;
};

export function SystemHealthTab({ onSeeRuns }: SystemHealthTabProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const { data: systemHealth, isPending } = healthQueries.useSystemHealth();
  const latestVersion = systemHealth?.latestVersion;
  const release = systemHealth?.release;
  const currentVersion = release?.current;

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion, latestVersion);
  }, [currentVersion, latestVersion]);

  const releaseIntegrityOk =
    !!release &&
    release.current !== UNREADABLE_RELEASE_VERSION &&
    release.workers.versionMismatched === 0;
  const releaseIntegrityMessage = (() => {
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
  })();

  const allAppRows: HealthRow[] = [
    {
      id: 'version',
      title: t('Version'),
      icon: <Package className="size-4" />,
      status: isVersionUpToDate ? 'passed' : 'failed',
      link: 'https://github.com/activepieces/activepieces/releases',
      message: (
        <span className="flex flex-wrap items-center gap-x-2">
          <span>
            {t('Current')} {currentVersion || t('Unknown')}
          </span>
          <span className="size-1 rounded-full bg-gray-6" />
          <span>
            {t('Latest')} {latestVersion || t('Unknown')}
          </span>
        </span>
      ),
    },
    {
      id: 'release-integrity',
      title: t('Release Integrity'),
      icon: <GitCompareArrows className="size-4" />,
      status: releaseIntegrityOk ? 'passed' : 'failed',
      link: 'https://www.activepieces.com/docs/install/configuration/overview',
      message: releaseIntegrityMessage,
    },
    {
      id: 'app-disk',
      title: t('Disk'),
      icon: <HardDrive className="size-4" />,
      status: toStatus(systemHealth?.disk),
      link: HARDWARE_DOCS_LINK,
      message: t('At least 30GB of disk space is required.'),
    },
    {
      id: 'app-ram',
      title: t('RAM'),
      icon: <MemoryStick className="size-4" />,
      status: toStatus(systemHealth?.appRam),
      link: HARDWARE_DOCS_LINK,
      message: t('At least 2GB of RAM is required.'),
    },
    {
      id: 'app-cpu',
      title: t('CPU'),
      icon: <Cpu className="size-4" />,
      status: toStatus(systemHealth?.appCpu),
      link: HARDWARE_DOCS_LINK,
      message: t('At least 1 CPU core is required.'),
    },
  ];
  const appRows = isCloud
    ? allAppRows.filter((row) => !CLOUD_HIDDEN_ROW_IDS.includes(row.id))
    : allAppRows;

  const workersConnected = !isNil(systemHealth?.workerRam);

  const workerRows: HealthRow[] = [
    {
      id: 'worker-ram',
      title: t('RAM'),
      icon: <MemoryStick className="size-4" />,
      status: toStatus(systemHealth?.workerRam),
      link: HARDWARE_DOCS_LINK,
      message: workersConnected
        ? t('At least 1GB of RAM is required per worker.')
        : t('No workers are connected.'),
    },
    {
      id: 'worker-cpu',
      title: t('CPU'),
      icon: <Cpu className="size-4" />,
      status: toStatus(systemHealth?.workerCpu),
      link: HARDWARE_DOCS_LINK,
      message: workersConnected
        ? t('At least 0.5 CPU core is required per worker.')
        : t('No workers are connected.'),
    },
  ];

  return (
    <>
      <Alert variant="primary">
        <Info />
        <AlertDescription className="text-pretty">
          {t(
            'In production setups, we recommend a ratio of about 1 app instance to 10 workers.',
          )}
        </AlertDescription>
      </Alert>
      <HealthCard
        title={t('App')}
        description={t('API server, UI and webhook routing')}
        icon={<Server className="size-4" />}
        rows={appRows}
        loading={isPending}
      />
      <HealthCard
        title={t('Workers')}
        description={t('Machines that execute your flows')}
        icon={<Boxes className="size-4" />}
        rows={workerRows}
        loading={isPending}
      />
      <DailyHealthStrip onSeeRuns={onSeeRuns} />
    </>
  );
}

function toStatus(value: boolean | null | undefined): Status {
  if (value === null) return 'na';
  if (value === undefined) return 'loading';
  return value ? 'passed' : 'failed';
}

function HealthCard({
  title,
  description,
  icon,
  rows,
  loading,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  rows: HealthRow[];
  loading: boolean;
}) {
  return (
    <SettingsPanel
      title={
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
      }
      description={description}
      flush
    >
      {rows.map((row) => (
        <HealthRowItem key={row.id} row={row} loading={loading} />
      ))}
    </SettingsPanel>
  );
}

function HealthRowItem({ row, loading }: { row: HealthRow; loading: boolean }) {
  const status = loading ? 'loading' : row.status;
  const config = STATUS_CONFIG[status];
  return (
    <SettingsRow
      icon={row.icon}
      title={
        <>
          {row.title}
          {row.link && (
            <a
              {...adminControl(AdminControl.HEALTH_CHECK_DOCS_LINK)}
              href={row.link}
              target="_blank"
              rel="noreferrer"
              className="text-gray-11 hover:text-gray-12"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </>
      }
      description={row.message}
    >
      <StatusDot tone={config.tone} pulse={status === 'loading'}>
        {t(config.label)}
      </StatusDot>
    </SettingsRow>
  );
}

const STATUS_CONFIG: Record<Status, { label: string; tone: StatusTone }> = {
  loading: { label: 'Checking', tone: 'neutral' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Needs attention', tone: 'danger' },
  na: { label: 'Not applicable', tone: 'neutral' },
};

type Status = 'passed' | 'failed' | 'na' | 'loading';

type HealthRow = {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: Status;
  message: React.ReactNode;
  link?: string;
};
