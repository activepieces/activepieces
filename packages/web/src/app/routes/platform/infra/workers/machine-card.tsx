import {
  WorkerGroupScope,
  WorkerMachineStatus,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Box,
  Cpu,
  HardDrive,
  LucideIcon,
  MemoryStick,
  Server,
  SlidersHorizontal,
} from 'lucide-react';
import prettyBytes from 'pretty-bytes';
import { useState } from 'react';

import { listFormat } from '@/components/custom/list/list-format';
import { RowMenu } from '@/components/custom/list/row-menu';
import { ResourceCard } from '@/components/custom/resource-card';
import { Meter } from '@/components/custom/stats';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  MachineConfigurationDialog,
  MachineSandboxesDialog,
} from './machine-details-dialogs';

export function MachineCard({ worker, number }: MachineCardProps) {
  const [openDialog, setOpenDialog] = useState<MachineDialog | null>(null);
  const online = worker.status === WorkerMachineStatus.ONLINE;
  const {
    diskInfo,
    cpuUsagePercentage,
    ramUsagePercentage,
    totalAvailableRamInBytes,
    ip,
    workerProps,
    totalCpuCores,
  } = worker.information;
  const sandboxes = worker.information.sandboxes ?? [];
  const busySandboxes = sandboxes.filter((sandbox) => sandbox.busy).length;
  const usedRamBytes = totalAvailableRamInBytes * (ramUsagePercentage / 100);
  const version = workerProps.version;
  const title = t('Machine {number}', { number });

  return (
    <>
      <ResourceCard
        media={
          <span className="flex size-8 items-center justify-center rounded-lg bg-gray-3 text-gray-11">
            <Server className="size-4" />
          </span>
        }
        title={title}
        status={
          <StatusDot tone={online ? 'success' : 'danger'}>
            {online ? t('Online') : t('Offline')}
          </StatusDot>
        }
        menu={
          <RowMenu
            items={[
              {
                label: t('Configuration'),
                icon: SlidersHorizontal,
                onSelect: () => setOpenDialog('configuration'),
              },
              {
                label: t('Sandboxes'),
                icon: Box,
                onSelect: () => setOpenDialog('sandboxes'),
              },
            ]}
          />
        }
        meta={
          <span className="flex min-w-0 items-center gap-1.5">
            <GroupLabel worker={worker} />
            <span aria-hidden>·</span>
            <TextWithTooltip tooltipMessage={ip}>
              <span className="min-w-0 truncate font-mono text-xs">{ip}</span>
            </TextWithTooltip>
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          <UsageMeter
            icon={Cpu}
            label={t('CPU')}
            percentage={cpuUsagePercentage}
            detail={t('{count, plural, =1 {# core} other {# cores}}', {
              count: totalCpuCores,
            })}
          />
          <UsageMeter
            icon={MemoryStick}
            label={t('RAM')}
            percentage={ramUsagePercentage}
            detail={t('{used} of {total}', {
              used: prettyBytes(usedRamBytes, { binary: true }),
              total: prettyBytes(totalAvailableRamInBytes, { binary: true }),
            })}
          />
          <UsageMeter
            icon={HardDrive}
            label={t('Disk')}
            percentage={diskInfo.percentage}
            detail={t('{used} of {total}', {
              used: prettyBytes(diskInfo.used, { binary: true }),
              total: prettyBytes(diskInfo.total, { binary: true }),
            })}
          />
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-gray-6 pt-3 text-xs text-gray-11">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate">
                {t('Seen {time}', {
                  time: listFormat.relativeDate(worker.updated).toLowerCase(),
                })}
              </span>
            </TooltipTrigger>
            <TooltipContent>{listFormat.dateTime(worker.updated)}</TooltipContent>
          </Tooltip>
          <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
            {sandboxes.length > 0 && (
              <>
                <span>
                  {t('{busy} of {total} sandboxes busy', {
                    busy: busySandboxes,
                    total: sandboxes.length,
                  })}
                </span>
                {version && <span aria-hidden>·</span>}
              </>
            )}
            {version && <span>{t('Version {version}', { version })}</span>}
          </span>
        </div>
      </ResourceCard>
      <MachineConfigurationDialog
        title={title}
        workerProps={workerProps}
        open={openDialog === 'configuration'}
        onOpenChange={(open) => setOpenDialog(open ? 'configuration' : null)}
      />
      <MachineSandboxesDialog
        title={title}
        sandboxes={sandboxes}
        open={openDialog === 'sandboxes'}
        onOpenChange={(open) => setOpenDialog(open ? 'sandboxes' : null)}
      />
    </>
  );
}

function GroupLabel({ worker }: { worker: WorkerMachineWithStatus }) {
  if (worker.workerGroupScope === WorkerGroupScope.PROJECT) {
    const group = workerGroupUtils.displayName(worker.workerGroupId ?? '');
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="truncate">{group}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {t('This worker runs the projects assigned to the {group} group.', {
            group,
          })}
        </TooltipContent>
      </Tooltip>
    );
  }
  const dedicated = worker.workerGroupScope === WorkerGroupScope.PLATFORM;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0">
          {dedicated ? t('Dedicated') : t('Shared')}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {dedicated
          ? t(
              'This worker runs exclusively for your platform with no sandboxing overhead.',
            )
          : t(
              'This worker is shared across platforms and uses strict sandboxing for isolation.',
            )}
      </TooltipContent>
    </Tooltip>
  );
}

function UsageMeter({
  icon: Icon,
  label,
  percentage,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  percentage: number;
  detail: string;
}) {
  return (
    <Meter
      value={percentage}
      max={100}
      label={
        <>
          <Icon className="text-gray-11" />
          {label}
        </>
      }
      limit={
        <span className="flex items-center gap-1.5">
          <span>{detail}</span>
          <span aria-hidden>·</span>
          <span className="font-medium text-gray-12">
            {Math.round(percentage)}%
          </span>
        </span>
      }
    />
  );
}

export const workerGroupUtils = {
  displayName: (groupId: string) => groupId.replaceAll('_', ' '),
};

type MachineDialog = 'configuration' | 'sandboxes';

type MachineCardProps = {
  worker: WorkerMachineWithStatus;
  number: number;
};
