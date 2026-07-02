import {
  AppConnectionStatus,
  ChatMentionType,
  FlowStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUpRight, Blocks, Plug, Table2, Zap } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Fragment } from 'react';

import { VerticalFlowIcon } from '@/components/icons/vertical-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { flowsApi } from '@/features/flows/api/flows-api';
import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { MentionItem, mentionSearch } from './use-mention-search';

const MAX_PREVIEW_STEPS = 5;
const MAX_PREVIEW_ROWS = 3;
const MAX_PREVIEW_FIELDS = 4;
const CELL_MAX_CHARS = 18;

function usePieceLogoMap(): Map<string, string> {
  const client = useQueryClient();
  const apps = client.getQueryData<MentionItem[]>(['mention-search', 'apps']);
  const map = new Map<string, string>();
  for (const app of apps ?? []) {
    if (app.logoUrl) map.set(app.id, app.logoUrl);
  }
  return map;
}

function PreviewHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-black/5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold leading-tight text-foreground">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-[12px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

function OpenButton({ route }: { route: string }) {
  const openNewWindow = useNewWindow();
  return (
    <button
      type="button"
      onClick={() => openNewWindow(route)}
      className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      {t('Open')}
      <ArrowUpRight className="size-3.5" />
    </button>
  );
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
      <PreviewHeader
        icon={<VerticalFlowIcon className="size-[18px]" />}
        title={flow.version.displayName}
        action={
          <OpenButton
            route={authenticationSession.appendProjectRoutePrefix(
              `/flows/${id}`,
            )}
          />
        }
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                'size-1.5 rounded-full',
                enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40',
              )}
            />
            {enabled ? t('Enabled') : t('Disabled')}
            <span className="text-muted-foreground/50">·</span>
            {t('{count} steps', { count: steps.length })}
          </span>
        }
      />

      <div className="flex flex-col">
        {shown.map((step, i) => {
          const pieceName =
            'pieceName' in step.settings ? step.settings.pieceName : undefined;
          const logo = pieceName ? logoMap.get(pieceName) : undefined;
          const last = i === shown.length - 1;
          return (
            <Fragment key={step.name}>
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background shadow-sm">
                  {logo ? (
                    <img src={logo} alt="" className="size-4 object-contain" />
                  ) : (
                    <VerticalFlowIcon className="size-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                  {step.displayName}
                </span>
              </div>
              {!last && (
                <span className="my-0.5 ml-[13px] h-3 w-0.5 rounded-full bg-border" />
              )}
            </Fragment>
          );
        })}
        {steps.length > shown.length && (
          <div className="ml-[13px] mt-1.5 text-[11px] text-muted-foreground">
            {t('+{count} more steps', { count: steps.length - shown.length })}
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
    <div className="flex flex-col gap-4">
      <PreviewHeader
        icon={<Table2 className="size-[18px]" />}
        title={label}
        action={
          <OpenButton
            route={authenticationSession.appendProjectRoutePrefix(
              `/tables/${id}`,
            )}
          />
        }
        subtitle={t('{count} fields', { count: fields.length })}
      />

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b bg-muted/40">
                {shownFields.map((field) => (
                  <th
                    key={field.id}
                    className="max-w-[120px] truncate px-3 py-2 text-left font-semibold text-muted-foreground"
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
                    className="px-3 py-5 text-center text-muted-foreground"
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
                      i % 2 === 1 && 'bg-muted/15',
                    )}
                  >
                    {shownFields.map((field) => (
                      <td
                        key={field.id}
                        className="max-w-[120px] truncate px-3 py-2 text-foreground/80"
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
  const { data: connections, isLoading } = useQuery({
    queryKey: ['mention-preview', 'app-connections-all', id],
    queryFn: () => mentionSearch.fetchConnectionsAcrossProjects(id),
    staleTime: 30_000,
  });
  const accounts = connections ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PreviewHeader
        icon={
          logoUrl ? (
            <img src={logoUrl} alt="" className="size-5 object-contain" />
          ) : (
            <Blocks className="size-[18px]" />
          )
        }
        title={label}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Plug className="size-3" />
            {isLoading
              ? t('Loading connections…')
              : t('{count} connected accounts', { count: accounts.length })}
          </span>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {t(
            'No accounts connected yet — you can connect one right here while we chat.',
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center gap-3 rounded-xl border bg-background p-2.5 shadow-sm"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60',
                )}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="size-4 object-contain" />
                ) : (
                  <Plug className="size-4 text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium leading-tight text-foreground">
                  {conn.displayName}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {conn.projectName}
                </div>
              </div>
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  connectionTone(conn.status),
                )}
                title={conn.status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MentionPreviewPanel({ item }: { item?: MentionItem }) {
  const reduce = useReducedMotion();
  return (
    <div className="hidden min-w-0 flex-1 flex-col border-l border-border/60 bg-[#FBFAF7] dark:bg-stone-900/40 sm:flex">
      <div className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
        {t('Preview')}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2.5">
        <AnimatePresence mode="wait">
          {!item ? (
            <motion.div
              key="empty"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2.5 text-center"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-background/70 text-muted-foreground/40 shadow-sm">
                <Zap className="size-5" />
              </span>
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

function PreviewTitle({ title }: { title: string }) {
  return (
    <div className="truncate text-[15px] font-semibold leading-tight">
      {title}
    </div>
  );
}

function RailSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PreviewTitle title={title} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function GridSkeleton({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <PreviewTitle title={title} />
      <Skeleton className="h-28 w-full rounded-xl" />
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
