import { t } from 'i18next';
import { ChevronLeft, ChevronRight, OctagonAlert, Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            {t('Project usage')}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {rows.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'Click a project for a detailed breakdown. Numbers for bring-your-own-key providers are estimates — exact spend lives in each provider’s dashboard.',
          )}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{t('Project')}</TableHead>
              <TableHead>{t('AI credits')}</TableHead>
              <TableHead>{t('Last activity')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={row.projectId}
                className="group cursor-pointer"
                onClick={() => setDetailProjectId(row.projectId)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProjectIconTile name={row.projectName} />
                    <span className="text-sm font-medium">
                      {row.projectName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <UsageCell row={row} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatUtils.formatDateToAgo(new Date(row.lastActivity))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingProjectId(row.projectId);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ChevronRight className="size-4 text-muted-foreground/60" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground tabular-nums">
          {t('Showing {from}–{to} of {total}', {
            from: currentPage * PAGE_SIZE + 1,
            to: currentPage * PAGE_SIZE + pageRows.length,
            total: rows.length,
          })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft className="size-4 mr-1" />
            {t('Previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            {t('Next')}
            <ChevronRight className="size-4 ml-1" />
          </Button>
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

function UsageCell({ row }: { row: MockProjectAiUsage }) {
  const { ratio, reached } = usageMath({ row });
  return (
    <div className="flex max-w-56 flex-col gap-1.5">
      <span className="text-sm tabular-nums">
        {row.creditsUsed.toLocaleString()}
        <span className="text-muted-foreground">
          {row.limit === null
            ? ` · ${t('No limit')}`
            : ` / ${row.limit.toLocaleString()}`}
        </span>
      </span>
      {row.limit !== null && (
        <Progress
          value={Math.min(ratio, 1) * 100}
          className={cn('h-1 w-40', { '[&>div]:bg-destructive': reached })}
        />
      )}
      {reached && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <OctagonAlert className="size-3 shrink-0" />
          {t('Limit reached')}
        </span>
      )}
    </div>
  );
}

const PAGE_SIZE = 10;
