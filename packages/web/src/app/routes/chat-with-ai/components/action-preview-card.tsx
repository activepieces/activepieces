import { ActionPreviewEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';

export function ActionPreviewCard({
  preview,
  onRun,
  onCancel,
}: {
  preview: ActionPreviewEvent;
  onRun: () => void;
  onCancel: () => void;
}) {
  const [showAllBatchItems, setShowAllBatchItems] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const pieceName = normalizePieceName(preview.pieceName);
  const inputParams = buildInputParams(preview.input);

  const batchSamples = preview.batchSamples ?? [];
  const visibleSamples = showAllBatchItems
    ? batchSamples
    : batchSamples.slice(0, 3);
  const hiddenCount = batchSamples.length - visibleSamples.length;

  return (
    <motion.div
      className="rounded-2xl border bg-background overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 mt-0.5">
            <PieceIconWithPieceName
              pieceName={pieceName}
              size="sm"
              border={false}
              showTooltip={false}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {preview.isBatch && preview.batchCount !== undefined
                ? t('{actionDisplayName} · {count} items', {
                    actionDisplayName: preview.actionDisplayName,
                    count: preview.batchCount,
                  })
                : preview.actionDisplayName}
            </p>
            {preview.connectionLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('Using: {connectionLabel}', {
                  connectionLabel: preview.connectionLabel,
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {preview.isBatch ? (
        <BatchParamsSection
          samples={visibleSamples}
          totalCount={preview.batchCount ?? batchSamples.length}
          hiddenCount={hiddenCount}
          showAll={showAllBatchItems}
          onToggleShowAll={() => setShowAllBatchItems((prev) => !prev)}
        />
      ) : (
        inputParams.length > 0 && <SingleParamsSection params={inputParams} />
      )}

      <RawJsonSection
        input={preview.input}
        open={showRawJson}
        onToggle={() => setShowRawJson((prev) => !prev)}
      />

      <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
        <Button size="sm" onClick={onRun} className="gap-1.5" type="button">
          <Check className="size-3.5" />
          {t('Run')}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} type="button">
          {t('Cancel')}
        </Button>
      </div>
    </motion.div>
  );
}

function SingleParamsSection({
  params,
}: {
  params: Array<{ key: string; value: string }>;
}) {
  return (
    <div className="px-4 pb-3">
      <div className="rounded-lg border bg-muted/20 divide-y overflow-hidden">
        {params.map(({ key, value }) => (
          <div key={key} className="flex items-start gap-3 px-3 py-2">
            <span className="text-xs text-muted-foreground shrink-0 min-w-[80px] pt-0.5">
              {key}
            </span>
            <span className="text-xs text-foreground break-words min-w-0 flex-1">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchParamsSection({
  samples,
  totalCount,
  hiddenCount,
  showAll,
  onToggleShowAll,
}: {
  samples: Record<string, unknown>[];
  totalCount: number;
  hiddenCount: number;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  if (samples.length === 0) return null;

  return (
    <div className="px-4 pb-3 space-y-1.5">
      <p className="text-xs text-muted-foreground">
        {t('{count, plural, =1 {1 item} other {# items}}', {
          count: totalCount,
        })}
      </p>
      <div className="rounded-lg border bg-muted/20 divide-y overflow-hidden">
        {samples.map((sample, i) => (
          <div key={i} className="px-3 py-2 space-y-1">
            {buildInputParams(sample).map(({ key, value }) => (
              <div key={key} className="flex items-start gap-3">
                <span className="text-xs text-muted-foreground shrink-0 min-w-[80px] pt-0.5">
                  {key}
                </span>
                <span className="text-xs text-foreground break-words min-w-0 flex-1">
                  {value}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {hiddenCount > 0 && (
          <motion.button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={onToggleShowAll}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChevronDown className="h-3 w-3" />
            {t('View all {count} items', { count: totalCount })}
          </motion.button>
        )}
        {showAll && samples.length > 3 && (
          <motion.button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={onToggleShowAll}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChevronUp className="h-3 w-3" />
            {t('Show less')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function RawJsonSection({
  input,
  open,
  onToggle,
}: {
  input: Record<string, unknown>;
  open: boolean;
  onToggle: () => void;
}) {
  const filteredInput = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== 'auth'),
  );

  return (
    <div className="border-t">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors',
        )}
        onClick={onToggle}
      >
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {t('Raw JSON')}
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
            <pre className="mx-4 mb-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {JSON.stringify(filteredInput, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function buildInputParams(
  input: Record<string, unknown>,
): Array<{ key: string; value: string }> {
  return Object.entries(input)
    .filter(([key]) => key !== 'auth')
    .map(([key, value]) => ({
      key,
      value: formatParamValue(value),
    }));
}

function formatParamValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value);
}
