import {
  ApEdition,
  ApFlagId,
  WorkerMachineStatus,
  WorkerMachineType,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Server, Clock, Cpu, MemoryStick, HardDrive, Zap } from 'lucide-react';
import prettyBytes from 'pretty-bytes';
import React from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { RequestTrial } from '@/app/components/request-trial';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { workersQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useTimeAgo } from '@/hooks/use-time-ago';
import { cn } from '@/lib/utils';

import { WorkerConfigsModal } from './worker-configs-dialog';

export default function WorkersPage() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const { data: workersData, isLoading } = workersQueries.useWorkerMachines();

  const fleetType = workersData?.[0]?.type;

  return (
    <div className="flex flex-col w-full gap-4 px-4">
      <DashboardPageHeader
        description={t('Check the health of your workers')}
        title={t('Workers')}
      ></DashboardPageHeader>
      {isCloud && fleetType === WorkerMachineType.SHARED && (
        <Alert variant="primary">
          <Zap size={16} />
          <AlertTitle>{t('Upgrade to Dedicated Workers')}</AlertTitle>
          <AlertDescription className="text-xs">
            {t(
              'Your automations run on shared workers where strict sandboxing adds overhead to every execution. Dedicated workers give you your own execution pool that stays warm and ready, so your automations start much faster.',
            )}
          </AlertDescription>
          <AlertAction>
            <RequestTrial
              featureKey="DEDICATED_WORKERS"
              buttonVariant="default"
              buttonSize="xs"
            />
          </AlertAction>
        </Alert>
      )}
      {isCloud && fleetType === WorkerMachineType.DEDICATED && (
        <Alert variant="success">
          <Zap size={16} />
          <AlertTitle>{t('Dedicated Workers Active')}</AlertTitle>
          <AlertDescription className="text-xs">
            {t(
              'Your workers run exclusively for your platform. The execution pool stays warm with no sandboxing overhead, so your automations start instantly.',
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </CardContent>
              <CardFooter>
                <div className="h-4 w-full bg-muted rounded" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (workersData ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Server className="size-14" />
          <p className="font-medium text-foreground">{t('No workers found')}</p>
          <p className="text-sm text-center max-w-sm">
            {t(
              "You don't have any workers yet. Spin up new workers to execute your automations",
            )}
          </p>
        </div>
      )}

      {!isLoading && (workersData ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(workersData ?? []).map((worker, index) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              index={index}
              isCloud={isCloud}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, detail }: StatBarProps) {
  const barColor =
    value > 95
      ? 'bg-destructive'
      : value > 80
      ? 'bg-warning'
      : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-muted-foreground shrink-0 flex items-center gap-1.5">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', barColor)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right shrink-0">
        {value.toFixed(1)}%
      </span>
      {detail && (
        <span className="text-xs text-foreground shrink-0 w-28 text-right">
          {detail}
        </span>
      )}
    </div>
  );
}

function WorkerCard({ worker, index, isCloud }: WorkerCardProps) {
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

  const version = workerProps.version ?? 'v0.39.4';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Server
              size={18}
              className={cn('shrink-0', {
                'text-destructive': !isOnline,
              })}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                Machine #{index + 1}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {ip}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isCloud && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={
                      worker.type === WorkerMachineType.DEDICATED
                        ? 'success'
                        : 'secondary'
                    }
                  >
                    {worker.type === WorkerMachineType.DEDICATED
                      ? t('Dedicated')
                      : t('Shared')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {worker.type === WorkerMachineType.DEDICATED
                    ? t(
                        'This worker runs exclusively for your platform with no sandboxing overhead.',
                      )
                    : t(
                        'This worker is shared across platforms and uses strict sandboxing for isolation.',
                      )}
                </TooltipContent>
              </Tooltip>
            )}
            <Badge variant={isOnline ? 'success' : 'destructive'}>
              {t(worker.status.toLowerCase())}
            </Badge>
            <WorkerConfigsModal workerProps={workerProps} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        <StatBar
          label={
            <>
              <Cpu className="size-3" />
              <span>CPU</span>
            </>
          }
          value={cpuUsagePercentage}
          detail={`${totalCpuCores} core${totalCpuCores === 1 ? '' : 's'}`}
        />
        <StatBar
          label={
            <>
              <MemoryStick className="size-3" />
              <span>RAM</span>
            </>
          }
          value={ramUsagePercentage}
          detail={`${prettyBytes(usedRamBytes, {
            binary: true,
          })} / ${prettyBytes(totalAvailableRamInBytes, { binary: true })}`}
        />
        <StatBar
          label={
            <>
              <HardDrive className="size-3" />
              <span>Disk</span>
            </>
          }
          value={diskInfo.percentage}
          detail={`${prettyBytes(usedDiskBytes, {
            binary: true,
          })} / ${prettyBytes(diskInfo.total, { binary: true })}`}
        />
      </CardContent>

      <CardFooter className="justify-between pt-0 gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
          <span className="flex items-center gap-1 truncate">
            <Clock size={12} className="shrink-0" />
            {t('seen')} {timeAgo}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {version}
        </span>
      </CardFooter>
    </Card>
  );
}

type StatBarProps = { label: React.ReactNode; value: number; detail?: string };
type WorkerCardProps = {
  worker: WorkerMachineWithStatus;
  index: number;
  isCloud: boolean;
};
