import { SandboxInformation, WorkerProps } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Box, SlidersHorizontal } from 'lucide-react';
import prettyBytes from 'pretty-bytes';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { MutedCell, NumberCell } from '@/components/custom/list/list-cells';
import { StatusDot } from '@/components/custom/status-dot';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function MachineConfigurationDialog({
  title,
  workerProps,
  open,
  onOpenChange,
}: {
  title: string;
  workerProps: WorkerProps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rows: ConfigRow[] = Object.entries(workerProps ?? {}).map(
    ([key, value]) => ({ id: key, key, value: String(value ?? '') }),
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t('Configuration')}</DialogTitle>
          <DialogDescription>
            {t('Environment settings {machine} started with.', {
              machine: title,
            })}
          </DialogDescription>
        </DialogHeader>
        <DataTable
          columns={CONFIG_COLUMNS}
          page={{ data: rows, next: null, previous: null }}
          isLoading={false}
          isError={false}
          errorStateEntity={t('configuration')}
          hidePagination
          emptyStateTextTitle={t('No configuration reported')}
          emptyStateTextDescription={t(
            'This machine did not report its settings.',
          )}
          emptyStateIcon={<SlidersHorizontal />}
        />
      </DialogContent>
    </Dialog>
  );
}

export function MachineSandboxesDialog({
  title,
  sandboxes,
  open,
  onOpenChange,
}: {
  title: string;
  sandboxes: SandboxInformation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rows: SandboxRow[] = sandboxes.map((sandbox) => ({
    ...sandbox,
    id: sandbox.sandboxId,
  }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t('Sandboxes')}</DialogTitle>
          <DialogDescription>
            {t('Isolated processes {machine} runs flows in.', {
              machine: title,
            })}
          </DialogDescription>
        </DialogHeader>
        <DataTable
          columns={SANDBOX_COLUMNS}
          page={{ data: rows, next: null, previous: null }}
          isLoading={false}
          isError={false}
          errorStateEntity={t('sandboxes')}
          hidePagination
          emptyStateTextTitle={t('No sandboxes running')}
          emptyStateTextDescription={t(
            'Sandboxes start when this machine picks up a run.',
          )}
          emptyStateIcon={<Box />}
        />
      </DialogContent>
    </Dialog>
  );
}

const CONFIG_COLUMNS: ColumnDef<RowDataWithActions<ConfigRow>, unknown>[] = [
  {
    accessorKey: 'key',
    header: () => t('Variable'),
    cell: ({ row }) => (
      <span className="block truncate font-mono text-xs text-gray-12">
        {row.original.key}
      </span>
    ),
  },
  {
    accessorKey: 'value',
    header: () => t('Value'),
    cell: ({ row }) => (
      <MutedCell className="font-mono text-xs">{row.original.value}</MutedCell>
    ),
  },
];

const SANDBOX_COLUMNS: ColumnDef<RowDataWithActions<SandboxRow>, unknown>[] = [
  {
    accessorKey: 'boxId',
    header: () => t('Sandbox'),
    cell: ({ row }) => (
      <span className="font-medium text-gray-12 tabular-nums">
        {t('Sandbox {number}', { number: row.original.boxId })}
      </span>
    ),
  },
  {
    accessorKey: 'busy',
    header: () => t('Status'),
    cell: ({ row }) => (
      <StatusDot tone={row.original.busy ? 'accent' : 'neutral'}>
        {row.original.busy ? t('Busy') : t('Idle')}
      </StatusDot>
    ),
  },
  {
    accessorKey: 'memoryUsageBytes',
    size: 120,
    header: () => <span className="block text-right">{t('Memory')}</span>,
    cell: ({ row }) => (
      <NumberCell>
        {prettyBytes(row.original.memoryUsageBytes, { binary: true })}
      </NumberCell>
    ),
  },
];

type ConfigRow = {
  id: string;
  key: string;
  value: string;
};

type SandboxRow = SandboxInformation & { id: string };
