import { isObject, Permission } from '@activepieces/core-utils';
import { ActionPreviewEvent, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { normalizePieceName } from '../lib/message-parsers';

import { InteractiveCardShell } from './interactive-card-shell';
import { HtmlPreview } from './previews/html-preview';

export function ActionPreviewCard({
  preview,
  onRun,
  onCancel,
  onDismiss,
}: {
  preview: ActionPreviewEvent;
  onRun: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const diff = settingsDiffOf(preview);
  if (diff) {
    return (
      <SettingsDiffCard
        title={preview.actionDisplayName}
        diff={diff}
        onApprove={onRun}
        onCancel={onCancel}
        onDismiss={onDismiss}
      />
    );
  }
  const pieceName = normalizePieceName(preview.pieceName);
  const inputParams = buildInputParams(preview.input);

  const batchSamples = preview.batchSamples ?? [];
  const totalBatchCount = preview.batchCount ?? batchSamples.length;
  const hasMoreThanSamples = totalBatchCount > batchSamples.length;

  return (
    <InteractiveCardShell
      onDismiss={onDismiss}
      title={
        preview.isBatch && preview.batchCount !== undefined
          ? t('{actionDisplayName} · {count} items', {
              actionDisplayName: preview.actionDisplayName,
              count: preview.batchCount,
            })
          : preview.actionDisplayName
      }
    >
      {preview.taskTitle && (
        <p className="truncate pb-2 text-xs text-gray-11">
          {t('Asked by {taskTitle}', { taskTitle: preview.taskTitle })}
        </p>
      )}
      {preview.pieceName && (
        <div className="flex items-center gap-2 pb-3">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          {preview.connectionLabel && (
            <span className="text-xs text-gray-11">
              {t('Using: {connectionLabel}', {
                connectionLabel: preview.connectionLabel,
              })}
            </span>
          )}
        </div>
      )}

      {preview.isBatch ? (
        <BatchParamsSection
          samples={batchSamples}
          totalCount={totalBatchCount}
          hasMore={hasMoreThanSamples}
        />
      ) : (
        inputParams.length > 0 && <ParamsSection params={inputParams} />
      )}

      <div className="flex items-center gap-2 pt-3 border-t">
        <Button size="sm" onClick={onRun} className="gap-1.5" type="button">
          <Check className="size-3.5" />
          {t('Run')}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} type="button">
          {t('Cancel')}
        </Button>
      </div>
    </InteractiveCardShell>
  );
}

function SettingsDiffCard({
  title,
  diff,
  onApprove,
  onCancel,
  onDismiss,
}: {
  title: string;
  diff: SettingsDiff;
  onApprove: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const { data: user } = userHooks.useCurrentUser();
  const { checkAccess } = useAuthorization();
  const canApprove =
    diff.scope === 'platform'
      ? user?.platformRole === PlatformRole.ADMIN
      : checkAccess(diff.permission);

  return (
    <InteractiveCardShell onDismiss={onDismiss} title={title}>
      {diff.conflict && (
        <div
          role="status"
          className="mb-3 flex items-start gap-2 rounded-lg border border-warning-7 bg-warning-3 px-3 py-2 text-xs text-gray-12"
        >
          <AlertTriangle
            className="mt-px size-3.5 shrink-0 text-warning-11"
            aria-hidden
          />
          <span>
            {t(
              'This setting changed since I checked. Here is the current value. Approve again to apply the change.',
            )}
          </span>
        </div>
      )}
      <div className="pb-3">
        <div className="rounded-xl border bg-gray-3/20 divide-y overflow-hidden">
          {diff.rows.map((row) => (
            <DiffRow key={row.key} row={row} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        {canApprove ? (
          <Button
            size="sm"
            onClick={onApprove}
            className="gap-1.5"
            type="button"
          >
            <Check className="size-3.5" aria-hidden />
            {t('Approve')}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-11">
            <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
            {t('Ask an admin to approve this change.')}
          </span>
        )}
        <Button size="sm" variant="outline" onClick={onCancel} type="button">
          {t('Cancel')}
        </Button>
      </div>
    </InteractiveCardShell>
  );
}

function DiffRow({ row }: { row: DiffRowData }) {
  const after = displayValue(row.after);
  const before = row.hasBefore ? displayValue(row.before) : null;
  return (
    <div
      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-xs"
      aria-label={
        before === null
          ? t('{field}: {after}', { field: row.label, after })
          : t('{field}: {before} to {after}', {
              field: row.label,
              before,
              after,
            })
      }
    >
      <span className="shrink-0 text-gray-11">
        {t('{field}:', { field: row.label })}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
        {before !== null && (
          <>
            <span className="break-words text-gray-11 line-through decoration-gray-8">
              {before}
            </span>
            <ArrowRight
              className="size-3 shrink-0 self-center text-gray-9"
              aria-hidden
            />
          </>
        )}
        <span className="break-words font-medium text-gray-12">{after}</span>
      </span>
    </div>
  );
}

function settingsDiffOf(preview: ActionPreviewEvent): SettingsDiff | null {
  if (!SETTINGS_TOOLS.includes(preview.actionName)) return null;
  const input = preview.input;
  const extra: Record<string, unknown> = preview;
  const before = recordOf(extra.before) ?? recordOf(input.before) ?? {};
  const scope =
    input.scope === 'project' || typeof input.projectId === 'string'
      ? 'project'
      : 'platform';
  const section = typeof input.section === 'string' ? input.section : '';
  const labels = recordOf(input.fieldLabels) ?? {};
  const labelOf = (key: string): string => {
    const custom = labels[key];
    if (typeof custom === 'string' && custom) return custom;
    return FIELD_LABELS[`${scope}.${section}.${key}`]?.() ?? humanize(key);
  };
  const invite = preview.actionName === 'ap_invite_member';
  const changes: Record<string, unknown> = invite
    ? { email: input.email, role: input.role }
    : recordOf(input.patch) ?? {};
  return {
    scope,
    permission: invite ? Permission.WRITE_INVITATION : Permission.WRITE_PROJECT,
    conflict: extra.conflict === true || input.conflict === true,
    rows: Object.entries(changes).map(([key, after]) => ({
      key,
      label: labelOf(key),
      hasBefore: key in before,
      before: before[key],
      after,
    })),
  };
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return isObject(value) ? value : null;
}

function humanize(key: string): string {
  const words = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return t('(empty)');
  }
  if (typeof value === 'boolean') return value ? t('On') : t('Off');
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

function ParamsSection({ params }: { params: InputParam[] }) {
  return (
    <div className="pb-3">
      <div className="rounded-xl border bg-gray-3/20 divide-y overflow-hidden">
        {params.map((param) => (
          <ParamRow key={param.key} param={param} />
        ))}
      </div>
    </div>
  );
}

function ParamRow({ param }: { param: InputParam }) {
  if (param.kind === 'scalar') {
    return (
      <div className="flex items-start gap-3 px-3 py-2">
        <ParamLabel>{param.key}</ParamLabel>
        <span className="text-xs text-gray-12 break-words min-w-0 flex-1">
          {param.text}
        </span>
      </div>
    );
  }
  return <ExpandableParamRow param={param} />;
}

function ExpandableParamRow({ param }: { param: RichInputParam }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-3 py-2">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ParamLabel>{param.key}</ParamLabel>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-gray-11 hover:text-gray-12 transition-colors">
          {t('Preview')}
          {open ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {param.kind === 'html' ? (
              <HtmlPreview html={param.value} label={param.key} />
            ) : (
              <pre className="mt-2 rounded-xl bg-gray-3/40 px-3 py-2 text-xs text-gray-12 overflow-auto max-h-60 whitespace-pre-wrap break-words">
                {param.value}
              </pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BatchParamsSection({
  samples,
  totalCount,
  hasMore,
}: {
  samples: Record<string, unknown>[];
  totalCount: number;
  hasMore: boolean;
}) {
  if (samples.length === 0) return null;

  return (
    <div className="pb-3 space-y-1.5">
      <p className="text-xs text-gray-11">
        {t('{count, plural, =1 {1 item} other {# items}}', {
          count: totalCount,
        })}
      </p>
      <div className="rounded-xl border bg-gray-3/20 divide-y overflow-hidden">
        {samples.map((sample, i) => (
          <div key={i} className="px-1 py-1 space-y-1">
            {buildInputParams(sample).map((param) => (
              <ParamRow key={param.key} param={param} />
            ))}
          </div>
        ))}
      </div>
      {hasMore && (
        <p className="text-xs text-gray-11">
          {t('and {count} more', {
            count: totalCount - samples.length,
          })}
        </p>
      )}
    </div>
  );
}

function ParamLabel({ children }: { children: string }) {
  return (
    <span className="text-xs text-gray-11 shrink-0 min-w-[80px] pt-0.5">
      {children}
    </span>
  );
}

const INLINE_VALUE_MAX_LENGTH = 120;

function buildInputParams(input: Record<string, unknown>): InputParam[] {
  return Object.entries(input)
    .filter(([key]) => key !== 'auth')
    .map(([key, value]) => classifyParam(key, value));
}

function classifyParam(key: string, value: unknown): InputParam {
  if (value == null) return { kind: 'scalar', key, text: '' };
  if (typeof value === 'number' || typeof value === 'boolean') {
    return { kind: 'scalar', key, text: String(value) };
  }
  if (typeof value === 'string') {
    if (looksLikeHtml(value)) return { kind: 'html', key, value };
    if (value.length > INLINE_VALUE_MAX_LENGTH || value.includes('\n')) {
      return { kind: 'text', key, value };
    }
    return { kind: 'scalar', key, text: value };
  }
  return { kind: 'text', key, value: JSON.stringify(value, null, 2) };
}

function looksLikeHtml(value: string): boolean {
  const trimmed = value.trimStart();
  return trimmed.startsWith('<') && /<\/?[a-z!][\s\S]*>/i.test(trimmed);
}

const SETTINGS_TOOLS = ['ap_update_settings', 'ap_invite_member'];

const FIELD_LABELS: Record<string, () => string> = {
  'platform.general.name': () => t('Platform name'),
  'project.general.displayName': () => t('Project name'),
};

type DiffRowData = {
  key: string;
  label: string;
  hasBefore: boolean;
  before: unknown;
  after: unknown;
};

type SettingsDiff = {
  scope: 'platform' | 'project';
  permission: Permission;
  conflict: boolean;
  rows: DiffRowData[];
};

type ScalarInputParam = { kind: 'scalar'; key: string; text: string };
type RichInputParam = { kind: 'html' | 'text'; key: string; value: string };
type InputParam = ScalarInputParam | RichInputParam;
