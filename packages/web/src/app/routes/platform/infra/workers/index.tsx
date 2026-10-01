import {
  ApEdition,
  ApFlagId,
  WorkerGroupScope,
  WorkerMachineStatus,
  WorkerMachineType,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Server,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Zap,
  Layers,
  LucideIcon,
} from 'lucide-react';
import prettyBytes from 'pretty-bytes';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Page, PageHeader } from '@/components/custom/page';
import { Meter } from '@/components/custom/stats';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RequestTrial } from '@/features/billing';
import { workersQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { useTimeAgo } from '@/hooks/use-time-ago';
import { cn } from '@/lib/utils';

import { SandboxesPopover } from './sandboxes-popover';
import { WorkerAssignmentsTab } from './worker-assignments-tab';
import { WorkerConfigsPopover } from './worker-configs-popover';

export default function WorkersPage({ section }: WorkersPageProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform } = platformHooks.useCurrentPlatform();
  const isCloud = edition === ApEdition.CLOUD;
  const { data: workersData, isLoading } = workersQueries.useWorkerMachines();

  const fleetType = workersData?.[0]?.type;

  return (
    <Page>
      <PageHeader
        title={t('Workers')}
        description={t('Check the health of your workers')}
      />

      {section === 'health' && (
        <>
          {isCloud && fleetType === WorkerMachineType.SHARED && (
            <Alert variant="info">
              <Zap />
              <AlertTitle>{t('Upgrade to Dedicated Workers')}</AlertTitle>
              <AlertDescription>
                {t(
                  'Your automations run on shared workers where strict sandboxing adds overhead to every execution. Dedicated workers give you your own execution pool that stays warm and ready, so your automations start much faster.',
                )}
              </AlertDescription>
              <AlertAction>
                <RequestTrial
                  featureKey="DEDICATED_WORKERS"
                  buttonVariant="default"
                  buttonSize="sm"
                />
              </AlertAction>
            </Alert>
          )}
          {isCloud && fleetType === WorkerMachineType.DEDICATED && (
            <Alert variant="success">
              <Zap />
              <AlertTitle>{t('Dedicated Workers Active')}</AlertTitle>
              <AlertDescription>
                {t(
                  'Your workers run exclusively for your platform. The execution pool stays warm with no sandboxing overhead, so your automations start instantly.',
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-4 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && (workersData ?? []).length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Server />
                </EmptyMedia>
                <EmptyTitle>{t('No workers found')}</EmptyTitle>
                <EmptyDescription>
                  {t(
                    "You don't have any workers yet. Spin up new workers to execute your automations",
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {!isLoading && (workersData ?? []).length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(workersData ?? []).map((worker, index) => (
                <WorkerCard key={worker.id} worker={worker} index={index} />
              ))}
            </div>
          )}
        </>
      )}

      {section === 'worker-groups' && (
        <LockedFeatureGuard
          featureKey="DEDICATED_WORKERS"
          locked={!platform.plan.workerGroupsEnabled}
          lockTitle={t('Worker groups')}
          lockDescription={t(
            'Give a project its own workers, so a busy project never slows down the rest and sensitive work runs in isolation.',
          )}
          lockDocumentationUrl="https://www.activepieces.com/docs/install/configure-operate/worker-groups"
        >
          <WorkerAssignmentsTab />
        </LockedFeatureGuard>
      )}
    </Page>
  );
}

function StatBar({ label, icon: Icon, value, detail }: StatBarProps) {
  return (
    <Meter
      value={value}
      max={100}
      label={
        <>
          <Icon className="text-gray-11" />
          {label}
        </>
      }
      limit={
        <span className="flex items-center gap-3">
          {detail && <span>{detail}</span>}
          <span className="font-medium text-gray-12">{value.toFixed(1)}%</span>
        </span>
      }
    />
  );
}

function WorkerCard({ worker, index }: WorkerCardProps) {
  const timeAgo = useTimeAgo(new Date(worker.updated));
  const isOnline = worker.status === WorkerMachineStatus.ONLINE;

  const {
    diskInfo,
    cpuUsagePercentage,
    ramUsagePercentage,
    totalAvailableRamInBytes,
    ip,
    workerProps,
    totalCpuCores,
  } = worker.information;

  const usedRamBytes = totalAvailableRamInBytes * (ramUsagePercentage / 100);
  const usedDiskBytes = diskInfo.used;

  const sandboxes = worker.information.sandboxes ?? [];

  const version = workerProps.version ?? 'v0.39.4';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Server
              className={cn('size-5 shrink-0', {
                'text-danger-11': !isOnline,
              })}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">Machine #{index + 1}</span>
              <TextWithTooltip tooltipMessage={ip}>
                <span className="truncate font-mono text-sm text-gray-11">
                  {ip}
                </span>
              </TextWithTooltip>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <WorkerConfigsPopover workerProps={workerProps} />
            <SandboxesPopover sandboxes={sandboxes} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              {worker.workerGroupScope === WorkerGroupScope.PROJECT &&
              worker.workerGroupId ? (
                <Badge variant="info">
                  <Layers />
                  {worker.workerGroupId.replaceAll('_', ' ')}
                </Badge>
              ) : (
                <Badge
                  variant={
                    worker.workerGroupScope === WorkerGroupScope.PLATFORM
                      ? 'success'
                      : 'secondary'
                  }
                >
                  {worker.workerGroupScope === WorkerGroupScope.PLATFORM
                    ? t('Dedicated')
                    : t('Shared')}
                </Badge>
              )}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {worker.workerGroupScope === WorkerGroupScope.PROJECT &&
              worker.workerGroupId
                ? t(
                    'This worker runs the projects assigned to the {group} group.',
                    {
                      group: worker.workerGroupId.replaceAll('_', ' '),
                    },
                  )
                : worker.workerGroupScope === WorkerGroupScope.PLATFORM
                ? t(
                    'This worker runs exclusively for your platform with no sandboxing overhead.',
                  )
                : t(
                    'This worker is shared across platforms and uses strict sandboxing for isolation.',
                  )}
            </TooltipContent>
          </Tooltip>
          <Badge variant={isOnline ? 'success' : 'destructive'}>
            {t(worker.status.toLowerCase())}
          </Badge>
        </div>
        <StatBar
          label="CPU"
          icon={Cpu}
          value={cpuUsagePercentage}
          detail={`${totalCpuCores} core${totalCpuCores === 1 ? '' : 's'}`}
        />
        <StatBar
          label="RAM"
          icon={MemoryStick}
          value={ramUsagePercentage}
          detail={`${prettyBytes(usedRamBytes, {
            binary: true,
          })} / ${prettyBytes(totalAvailableRamInBytes, { binary: true })}`}
        />
        <StatBar
          label="Disk"
          icon={HardDrive}
          value={diskInfo.percentage}
          detail={`${prettyBytes(usedDiskBytes, {
            binary: true,
          })} / ${prettyBytes(diskInfo.total, { binary: true })}`}
        />
      </CardContent>

      <CardFooter className="justify-between gap-3 border-t">
        <span className="flex min-w-0 items-center gap-2 truncate text-sm text-gray-11">
          <Clock className="size-4 shrink-0" />
          {t('seen')} {timeAgo}
        </span>
        <span className="shrink-0 font-mono text-sm text-gray-11">
          {version}
        </span>
      </CardFooter>
    </Card>
  );
}

type StatBarProps = {
  label: string;
  icon: LucideIcon;
  value: number;
  detail?: string;
};
type WorkerCardProps = {
  worker: WorkerMachineWithStatus;
  index: number;
};

type WorkersSection = 'health' | 'worker-groups';

type WorkersPageProps = {
  section: WorkersSection;
};
