import {
  AppConnectionStatus,
  ChatMentionType,
  FlowStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Blocks, Workflow, Zap } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Skeleton } from '@/components/ui/skeleton';
import { flowsApi } from '@/features/flows/api/flows-api';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { fieldsApi } from '@/features/tables/api/fields-api';
import { recordsApi } from '@/features/tables/api/records-api';
import { cn } from '@/lib/utils';

import { MentionItem, mentionSearch } from './use-mention-search';

const MAX_PREVIEW_STEPS = 6;
const MAX_PREVIEW_ROWS = 5;
const MAX_PREVIEW_FIELDS = 6;
const MAX_PREVIEW_COMPONENTS = 5;
const CELL_MAX_CHARS = 24;

function usePieceLogoMap(): Map<string, string> {
  const client = useQueryClient();
  const apps = client.getQueryData<MentionItem[]>(['mention-search', 'apps']);
  const map = new Map<string, string>();
  for (const app of apps ?? []) {
    if (app.logoUrl) {
      map.set(app.id, app.logoUrl);
    }
  }
  return map;
}

function FlowPreview({ id }: { id: string }) {
  const logoMap = usePieceLogoMap();
  const { data: flow, isLoading } = useQuery({
    queryKey: ['mention-preview', 'flow', id],
    queryFn: () => flowsApi.get(id),
    staleTime: 60_000,
  });

  if (isLoading || !flow) {
    return <RailSkeleton />;
  }
  const steps = flowStructureUtil.getAllSteps(flow.version.trigger);
  const shown = steps.slice(0, MAX_PREVIEW_STEPS);

  return (
    <div className="flex flex-col gap-2">
      <PreviewHeader
        icon={<Workflow className="size-4 text-primary" />}
        title={flow.version.displayName}
        badge={
          <StatusPill
            label={flow.status}
            tone={flow.status === FlowStatus.ENABLED ? 'green' : 'gray'}
          />
        }
      />
      <div className="relative flex flex-col gap-1.5 pl-1">
        {shown.map((step, i) => {
          const pieceName =
            'pieceName' in step.settings ? step.settings.pieceName : undefined;
          const logo = pieceName ? logoMap.get(pieceName) : undefined;
          return (
            <div key={step.name} className="flex items-center gap-2">
              <div className="relative flex flex-col items-center">
                <span className="flex size-5 items-center justify-center rounded-md border bg-background">
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="size-3.5 object-contain"
                    />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                </span>
                {i < shown.length - 1 && (
                  <span className="h-3 w-px bg-border" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
                {step.displayName}
              </span>
            </div>
          );
        })}
        {steps.length > shown.length && (
          <span className="pl-7 text-xs text-muted-foreground">
            {t('+{{count}} more steps', { count: steps.length - shown.length })}
          </span>
        )}
      </div>
      <PreviewFooter text={t('{{count}} steps', { count: steps.length })} />
    </div>
  );
}

function TablePreview({ id, label }: { id: string; label: string }) {
  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['mention-preview', 'table-fields', id],
    queryFn: () => fieldsApi.list({ tableId: id }),
    staleTime: 60_000,
  });
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['mention-preview', 'table-records', id],
    queryFn: () =>
      recordsApi.list({
        tableId: id,
        limit: MAX_PREVIEW_ROWS,
        cursor: undefined,
      }),
    staleTime: 60_000,
  });

  if (fieldsLoading || recordsLoading || !fields) {
    return <GridSkeleton />;
  }
  const shownFields = fields.slice(0, MAX_PREVIEW_FIELDS);
  const rows = records?.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <PreviewHeader
        icon={<Blocks className="size-4 text-primary" />}
        title={label}
        badge={
          <StatusPill
            label={t('{{count}} fields', { count: fields.length })}
            tone="gray"
          />
        }
      />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              {shownFields.map((field) => (
                <th
                  key={field.id}
                  className="truncate px-2 py-1 text-left font-medium text-muted-foreground"
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
                  colSpan={shownFields.length}
                  className="px-2 py-3 text-center text-muted-foreground"
                >
                  {t('No records yet')}
                </td>
              </tr>
            ) : (
              rows.map((record, i) => (
                <tr
                  key={record.id}
                  className={cn(i % 2 === 1 && 'bg-muted/20')}
                >
                  {shownFields.map((field) => (
                    <td
                      key={field.id}
                      className="max-w-[120px] truncate px-2 py-1 text-foreground/80"
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
      <PreviewFooter
        text={t('{{fields}} fields · showing {{rows}} rows', {
          fields: fields.length,
          rows: rows.length,
        })}
      />
    </div>
  );
}

function AppPreview({ id, logoUrl }: { id: string; logoUrl?: string }) {
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

  if (isLoading || !piece) {
    return <AppSkeleton />;
  }
  const actions = Object.values(piece.actions)
    .map((a) => a.displayName)
    .slice(0, MAX_PREVIEW_COMPONENTS);
  const triggers = Object.values(piece.triggers)
    .map((tr) => tr.displayName)
    .slice(0, MAX_PREVIEW_COMPONENTS);
  const accounts = connections?.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        {logoUrl ?? piece.logoUrl ? (
          <img
            src={logoUrl ?? piece.logoUrl}
            alt=""
            className="size-8 shrink-0 rounded-md object-contain"
          />
        ) : (
          <Blocks className="size-8 text-primary" />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {piece.displayName}
          </div>
          {piece.description && (
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {piece.description}
            </div>
          )}
        </div>
      </div>

      <ComponentList
        title={t('Actions')}
        items={actions}
        total={Object.keys(piece.actions).length}
      />
      <ComponentList
        title={t('Triggers')}
        items={triggers}
        total={Object.keys(piece.triggers).length}
      />

      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {t('Connected accounts')}
        </div>
        {accounts.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            {t('No connected accounts yet')}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {accounts.map((conn) => (
              <div key={conn.id} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    connectionTone(conn.status),
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-foreground/90">
                  {conn.displayName}
                </span>
                <span className="text-muted-foreground">{conn.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MentionPreviewPanel({ item }: { item?: MentionItem }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hidden w-[280px] shrink-0 border-l bg-muted/20 p-3 sm:block">
      <AnimatePresence mode="wait">
        {!item ? (
          <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
            {t('Hover an item to preview it')}
          </div>
        ) : (
          <motion.div
            key={`${item.type}:${item.id}`}
            initial={reduceMotion ? false : { opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
          >
            {item.type === ChatMentionType.FLOW && <FlowPreview id={item.id} />}
            {item.type === ChatMentionType.TABLE && (
              <TablePreview id={item.id} label={item.label} />
            )}
            {item.type === ChatMentionType.APP && (
              <AppPreview id={item.id} logoUrl={item.logoUrl} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComponentList({
  title,
  items,
  total,
}: {
  title: string;
  items: string[];
  total: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Zap className="size-3" />
        {title} ({total})
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">{t('none')}</div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((name) => (
            <li key={name} className="truncate text-xs text-foreground/85">
              {name}
            </li>
          ))}
          {total > items.length && (
            <li className="text-xs text-muted-foreground">
              {t('+{{count}} more', { count: total - items.length })}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function PreviewHeader({
  icon,
  title,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {title}
      </span>
      {badge}
    </div>
  );
}

function PreviewFooter({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground">{text}</div>;
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'gray';
}) {
  return (
    <span
      className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
        tone === 'green'
          ? 'bg-green-500/15 text-green-600'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

function RailSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-24 w-full rounded-md" />
    </div>
  );
}

function AppSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
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
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }
  const str =
    typeof cell.value === 'string' ? cell.value : JSON.stringify(cell.value);
  return str.length > CELL_MAX_CHARS ? str.slice(0, CELL_MAX_CHARS) + '…' : str;
}

function connectionTone(status: AppConnectionStatus): string {
  if (status === AppConnectionStatus.ACTIVE) return 'bg-green-500';
  if (status === AppConnectionStatus.ERROR) return 'bg-red-500';
  return 'bg-amber-500';
}
