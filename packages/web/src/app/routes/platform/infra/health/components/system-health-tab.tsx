import { ApFlagId, isNil } from '@activepieces/shared';
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

import { LoadingSpinner } from '@/components/custom/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { healthQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { DailyHealthStrip } from './daily-health-strip';

const HARDWARE_DOCS_LINK =
  'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications';

const PRODUCTION_SETUP_LINK =
  'https://www.activepieces.com/docs/install/configure-operate/production-setup#what-it-looks-like';

// Matches UNKNOWN_VERSION in @activepieces/server-utils: the sentinel the backend reports when
// it could not read its release from package.json. Not importable here (server-only package).
const UNREADABLE_RELEASE_VERSION = '0.0.0';

type SystemHealthTabProps = {
  onSeeRuns: () => void;
};

export function SystemHealthTab({ onSeeRuns }: SystemHealthTabProps) {
  const { data: currentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: systemHealth, isPending } = healthQueries.useSystemHealth();
  const latestVersion = systemHealth?.latestVersion;

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion, latestVersion);
  }, [currentVersion, latestVersion]);

  const release = systemHealth?.release;
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

  const appRows: HealthRow[] = [
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
          <span className="size-1 rounded-full bg-border" />
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
    <div className="flex flex-col gap-4">
      <Alert variant="primary">
        <Info />
        <AlertDescription className="text-pretty">
          {t(
            'In production setups, we recommend a ratio of about 1 app instance to 10 workers.',
          )}{' '}
          <a href={PRODUCTION_SETUP_LINK} target="_blank" rel="noreferrer">
            {t('Learn more')}
          </a>
        </AlertDescription>
      </Alert>
      <div className="flex flex-col gap-4">
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
      </div>
      <DailyHealthStrip onSeeRuns={onSeeRuns} />
    </div>
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
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <CardContent className="divide-y p-0">
        {rows.map((row) => (
          <HealthRowItem key={row.id} row={row} loading={loading} />
        ))}
      </CardContent>
    </Card>
  );
}

function HealthRowItem({ row, loading }: { row: HealthRow; loading: boolean }) {
  const status = loading ? 'loading' : row.status;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          status === 'failed'
            ? 'bg-destructive-50 text-destructive-700'
            : status === 'passed'
            ? 'bg-success-50 text-success-700'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {row.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{row.title}</span>
          {row.link && (
            <a
              href={row.link}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{row.message}</div>
      </div>
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoadingSpinner className="size-3.5" />
        {t('Checking')}
      </span>
    );
  }
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        config.text,
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.dot)} />
      {t(config.label)}
    </span>
  );
}

const STATUS_CONFIG = {
  passed: {
    label: 'Passed',
    text: 'text-success-700',
    dot: 'bg-success-600',
  },
  failed: {
    label: 'Needs attention',
    text: 'text-destructive-700',
    dot: 'bg-destructive-600',
  },
  na: {
    label: 'Not applicable',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
} as const;

type Status = 'passed' | 'failed' | 'na' | 'loading';

type HealthRow = {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: Status;
  message: React.ReactNode;
  link?: string;
};
