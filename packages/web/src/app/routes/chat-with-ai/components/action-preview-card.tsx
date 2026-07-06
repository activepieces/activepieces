import { ActionPreviewEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

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
      {preview.pieceName && preview.connectionLabel && (
        <div className="flex items-center gap-2 pb-3">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <span className="text-xs text-muted-foreground">
            {t('Using: {connectionLabel}', {
              connectionLabel: preview.connectionLabel,
            })}
          </span>
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

function ParamsSection({ params }: { params: InputParam[] }) {
  return (
    <div className="pb-3">
      <div className="rounded-lg border bg-muted/20 divide-y overflow-hidden">
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
        <span className="text-xs text-foreground break-words min-w-0 flex-1">
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
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
              <pre className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground overflow-auto max-h-60 whitespace-pre-wrap break-words">
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
      <p className="text-xs text-muted-foreground">
        {t('{count, plural, =1 {1 item} other {# items}}', {
          count: totalCount,
        })}
      </p>
      <div className="rounded-lg border bg-muted/20 divide-y overflow-hidden">
        {samples.map((sample, i) => (
          <div key={i} className="px-1 py-1 space-y-1">
            {buildInputParams(sample).map((param) => (
              <ParamRow key={param.key} param={param} />
            ))}
          </div>
        ))}
      </div>
      {hasMore && (
        <p className="text-xs text-muted-foreground">
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
    <span className="text-xs text-muted-foreground shrink-0 min-w-[80px] pt-0.5">
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

type ScalarInputParam = { kind: 'scalar'; key: string; text: string };
type RichInputParam = { kind: 'html' | 'text'; key: string; value: string };
type InputParam = ScalarInputParam | RichInputParam;
