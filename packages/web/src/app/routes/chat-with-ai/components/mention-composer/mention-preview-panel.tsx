import {
  AppConnectionStatus,
  ChatMentionType,
  FlowStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Blocks, Plug, Table2, Workflow, Zap } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Skeleton } from '@/components/ui/skeleton';
import { flowsApi } from '@/features/flows/api/flows-api';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { cn } from '@/lib/utils';

import { MentionItem, mentionSearch } from './use-mention-search';

const MAX_PREVIEW_STEPS = 7;
const MAX_PREVIEW_ROWS = 5;
const MAX_PREVIEW_FIELDS = 5;
const MAX_PREVIEW_ACTIONS = 4;
const CELL_MAX_CHARS = 22;

function usePieceLogoMap(): Map<string, string> {
  const client = useQueryClient();
  const apps = client.getQueryData<MentionItem[]>(['mention-search', 'apps']);
  const map = new Map<string, string>();
  for (const app of apps ?? []) {
    if (app.logoUrl) map.set(app.id, app.logoUrl);
  }
  return map;
}

function pieceShort(name?: string): string | undefined {
  return name?.replace('@activepieces/piece-', '').replace(/-/g, ' ');
}

function FlowPreview({ id, label }: { id: string; label: string }) {
  const logoMap = usePieceLogoMap();
  const { data: flow, isLoading } = useQuery({
    queryKey: ['mention-preview', 'flow', id],
    queryFn: () => flowsApi.get(id),
    staleTime: 60_000,
  });

  if (isLoading || !flow) return <RailSkeleton title={label} />;
  const steps = flowStructureUtil.getAllSteps(flow.version.trigger);
  const shown = steps.slice(0, MAX_PREVIEW_STEPS);
  const enabled = flow.status === FlowStatus.ENABLED;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Workflow className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">
            {flow.version.displayName}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span
              className={cn(
                'size-1.5 rounded-full',
                enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40',
              )}
            />
            {enabled ? t('Enabled') : t('Disabled')}
            <span>·</span>
            {t('{{count}} steps', { count: steps.length })}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {shown.map((step, i) => {
          const pieceName =
            'pieceName' in step.settings ? step.settings.pieceName : undefined;
          const logo = pieceName ? logoMap.get(pieceName) : undefined;
          const isTrigger = i === 0;
          const last = i === shown.length - 1;
          return (
            <div key={step.name} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background',
                    isTrigger && 'border-primary/40 ring-2 ring-primary/10',
                  )}
                >
                  {logo ? (
                    <img src={logo} alt="" className="size-4 object-contain" />
                  ) : (
                    <span className="size-2 rounded-full bg-muted-foreground/40" />
                  )}
                </span>
                {!last && <span className="my-0.5 w-px flex-1 bg-border" />}
              </div>
              <div className={cn('min-w-0 flex-1', !last && 'pb-2')}>
                <div className="truncate text-[13px] font-medium leading-tight">
                  {step.displayName}
                </div>
                {pieceShort(pieceName) && (
                  <div className="truncate text-[11px] capitalize text-muted-foreground">
                    {pieceShort(pieceName)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {steps.length > shown.length && (
          <div className="pl-[38px] pt-0.5 text-[11px] text-muted-foreground">
            {t('+{{count}} more steps', { count: steps.length - shown.length })}
          </div>
        )}
      </div>
    </div>
  );
}

function TablePreview({ id, label }: { id: string; label: string }) {
  const { data: fields, isLoading: fl } = useQuery({
    queryKey: ['mention-preview', 'table-fields', id],
    queryFn: () => fieldsApi.list({ tableId: id }),
    staleTime: 60_000,
  });
  const { data: records, isLoading: rl } = useQuery({
    queryKey: ['mention-preview', 'table-records', id],
    queryFn: () =>
      recordsApi.list({
        tableId: id,
        limit: MAX_PREVIEW_ROWS,
        cursor: undefined,
      }),
    staleTime: 60_000,
  });

  if (fl || rl || !fields) return <GridSkeleton title={label} />;
  const shownFields = fields.slice(0, MAX_PREVIEW_FIELDS);
  const rows = records?.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Table2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">
            {label}
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {t('{{count}} fields', { count: fields.length })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b bg-muted/40">
                {shownFields.map((field) => (
                  <th
                    key={field.id}
                    className="max-w-[110px] truncate px-2.5 py-1.5 text-left font-semibold text-muted-foreground"
                  >
                    {field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={shownFields.length || 1}
                    className="px-2.5 py-4 text-center text-muted-foreground"
                  >
                    {t('No records yet')}
                  </td>
                </tr>
              ) : (
                rows.map((record, i) => (
                  <tr
                    key={record.id}
                    className={cn(
                      'border-b last:border-0',
                      i % 2 === 1 && 'bg-muted/20',
                    )}
                  >
                    {shownFields.map((field) => (
                      <td
                        key={field.id}
                        className="max-w-[110px] truncate px-2.5 py-1.5 text-foreground/80"
                      >
                        {cellValue(record, field.name)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {t('Showing {{rows}} of {{total}} sample rows', {
          rows: rows.length,
          total: rows.length,
        })}
      </div>
    </div>
  );
}

function AppPreview({
  id,
  label,
  logoUrl,
}: {
  id: string;
  label: string;
  logoUrl?: string;
}) {
  const { data: piece, isLoading } = useQuery({
    queryKey: ['mention-preview', 'app', id],
    queryFn: () => piecesApi.get({ name: id }),
    staleTime: 5 * 60_000,
  });
  const { data: connections } = useQuery({
    queryKey: ['mention-preview', 'app-connections', id],
    queryFn: () => mentionSearch.fetchConnectionsForPiece(id),
    staleTime: 30_000,
  });

  if (isLoading || !piece) return <AppSkeleton title={label} />;
  const actionCount = Object.keys(piece.actions).length;
  const triggerCount = Object.keys(piece.triggers).length;
  const topActions = Object.values(piece.actions)
    .map((a) => a.displayName)
    .slice(0, MAX_PREVIEW_ACTIONS);
  const accounts = connections?.data ?? [];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-2.5">
        {logoUrl ?? piece.logoUrl ? (
          <img
            src={logoUrl ?? piece.logoUrl}
            alt=""
            className="size-10 shrink-0 rounded-xl border bg-background object-contain p-1.5"
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Blocks className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">
            {piece.displayName}
          </div>
          {piece.description && (
            <div className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
              {piece.description}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <CapabilityPill
          icon={<Zap className="size-3" />}
          label={t('{{count}} actions', { count: actionCount })}
        />
        <CapabilityPill
          icon={<Workflow className="size-3" />}
          label={t('{{count}} triggers', { count: triggerCount })}
        />
      </div>
      {topActions.length > 0 && (
        <div className="text-[12px] leading-relaxed text-muted-foreground">
          {topActions.join(' · ')}
          {actionCount > topActions.length &&
            ` · +${actionCount - topActions.length}`}
        </div>
      )}

      <div className="rounded-xl border bg-background p-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold">
          <Plug className="size-3.5 text-primary" />
          {t('Connected accounts')}
          <span className="text-muted-foreground">({accounts.length})</span>
        </div>
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed px-2.5 py-3 text-center text-[12px] text-muted-foreground">
            {t('No accounts connected yet')}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {accounts.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5"
              >
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    connectionTone(conn.status),
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {conn.displayName}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MentionPreviewPanel({ item }: { item?: MentionItem }) {
  const reduce = useReducedMotion();
  return (
    <div className="hidden w-[380px] shrink-0 flex-col border-l bg-muted/30 sm:flex">
      <div className="px-4 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {t('Preview')}
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-2.5">
        <AnimatePresence mode="wait">
          {!item ? (
            <motion.div
              key="empty"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center"
            >
              <Blocks className="size-7 text-muted-foreground/30" />
              <span className="text-[12px] text-muted-foreground">
                {t('Hover an item to preview it')}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={`${item.type}:${item.id}`}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.13, ease: 'easeOut' }}
            >
              {item.type === ChatMentionType.FLOW && (
                <FlowPreview id={item.id} label={item.label} />
              )}
              {item.type === ChatMentionType.TABLE && (
                <TablePreview id={item.id} label={item.label} />
              )}
              {item.type === ChatMentionType.APP && (
                <AppPreview
                  id={item.id}
                  label={item.label}
                  logoUrl={item.logoUrl}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CapabilityPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
      {icon}
      {label}
    </span>
  );
}

function PreviewTitle({ title }: { title: string }) {
  return (
    <div className="truncate text-[15px] font-semibold leading-tight">
      {title}
    </div>
  );
}

function RailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <PreviewTitle title={title} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-3.5 flex-1" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <PreviewTitle title={title} />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

function AppSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <PreviewTitle title={title} />
          <Skeleton className="h-2.5 w-full" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

function cellValue(
  record: { cells: Record<string, { value: unknown; fieldName: string }> },
  fieldName: string,
): string {
  const cell = Object.values(record.cells).find(
    (c) => c.fieldName === fieldName,
  );
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const str =
    typeof cell.value === 'string' ? cell.value : JSON.stringify(cell.value);
  return str.length > CELL_MAX_CHARS ? str.slice(0, CELL_MAX_CHARS) + '…' : str;
}

function connectionTone(status: AppConnectionStatus): string {
  if (status === AppConnectionStatus.ACTIVE) return 'bg-emerald-500';
  if (status === AppConnectionStatus.ERROR) return 'bg-red-500';
  return 'bg-amber-500';
}
