import { t } from 'i18next';
import { ChevronLeft, ChevronRight, OctagonAlert, Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { MockProjectAiUsage, MockScenario } from '../mock/fixtures';

import { ProjectUsageSheet } from './project-usage-sheet';
import { SetLimitDialog } from './set-limit-dialog';
import { ProjectIconTile, usageMath } from './usage-utils';

export function UsageTab({ scenario }: { scenario: MockScenario }) {
  const [rows, setRows] = useState(scenario.usage);
  const [page, setPage] = useState(0);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const editingRow = rows.find((row) => row.projectId === editingProjectId);
  const detailRow = rows.find((row) => row.projectId === detailProjectId);

  const totalUsed = rows.reduce((acc, row) => acc + row.creditsUsed, 0);
  const nearLimit = rows.filter((row) => {
    const { ratio } = usageMath({ row });
    return row.limit !== null && ratio >= 0.8;
  }).length;
  const limitsSet = rows.filter((row) => row.limit !== null).length;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-6">
        <p className="text-sm font-medium">{t('No AI usage yet')}</p>
        <p className="text-sm text-muted-foreground">
          {t(
            'Usage appears here as soon as a project runs chat, agents, or AI steps.',
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label={t('Credits used this cycle')}
          value={totalUsed.toLocaleString()}
        />
        <StatTile
          label={t('Projects near their limit')}
          value={nearLimit.toLocaleString()}
          alert={nearLimit > 0}
        />
        <StatTile
          label={t('Projects with a limit')}
          value={`${limitsSet} / ${rows.length}`}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {t('Projects')}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {rows.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              'Click a project for a detailed breakdown. Bring-your-own-key numbers are estimates.',
            )}
          </p>
        </div>

        <div className="divide-y overflow-hidden rounded-lg border bg-card">
          {pageRows.map((row) => (
            <ProjectUsageRow
              key={row.projectId}
              row={row}
              onOpen={() => setDetailProjectId(row.projectId)}
              onEditLimit={() => setEditingProjectId(row.projectId)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('Showing {from}–{to} of {total}', {
              from: currentPage * PAGE_SIZE + 1,
              to: currentPage * PAGE_SIZE + pageRows.length,
              total: rows.length,
            })}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground tabular-nums">
              {t('Page {page} of {pages}', {
                page: currentPage + 1,
                pages: pageCount,
              })}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <SetLimitDialog
        open={editingRow !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProjectId(null);
          }
        }}
        projectName={editingRow?.projectName ?? ''}
        currentLimit={editingRow?.limit ?? null}
        onSave={(limit) => {
          setRows((current) =>
            current.map((row) =>
              row.projectId === editingProjectId ? { ...row, limit } : row,
            ),
          );
        }}
      />
      <ProjectUsageSheet
        row={detailRow}
        onOpenChange={(open) => {
          if (!open) {
            setDetailProjectId(null);
          }
        }}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn('text-2xl font-semibold tracking-tight tabular-nums', {
          'text-destructive': alert,
        })}
      >
        {value}
      </span>
    </div>
  );
}

function ProjectUsageRow({
  row,
  onOpen,
  onEditLimit,
}: {
  row: MockProjectAiUsage;
  onOpen: () => void;
  onEditLimit: () => void;
}) {
  const { ratio, reached } = usageMath({ row });
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onOpen();
        }
      }}
      className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_13rem_6.5rem_4rem]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <ProjectIconTile name={row.projectName} className="size-8" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium leading-none">
            {row.projectName}
          </span>
          {reached && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <OctagonAlert className="size-3 shrink-0" />
              {t('Limit reached')}
            </span>
          )}
        </div>
      </div>
      <div className="col-start-1 flex flex-col gap-1.5 sm:col-start-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">
            {row.creditsUsed.toLocaleString()}
          </span>
          {row.limit === null
            ? ` · ${t('No limit')}`
            : ` / ${row.limit.toLocaleString()}`}
        </span>
        {row.limit !== null && (
          <Progress
            value={Math.min(ratio, 1) * 100}
            className={cn('h-1', { '[&>div]:bg-destructive': reached })}
          />
        )}
      </div>
      <span className="hidden text-right text-xs text-muted-foreground sm:block">
        {formatUtils.formatDateToAgo(new Date(row.lastActivity))}
      </span>
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:col-start-4 sm:row-start-auto">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onEditLimit();
          }}
        >
          <Pencil className="size-4" />
        </Button>
        <ChevronRight className="size-4 text-muted-foreground/50" />
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;
