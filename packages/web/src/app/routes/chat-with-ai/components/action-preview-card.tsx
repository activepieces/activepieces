import { ActionPreviewEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Zap } from 'lucide-react';
import { useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';

import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatKeyValue } from './chat-ui/chat-key-value';
import { HtmlPreview } from './previews/html-preview';

export function ActionPreviewCard({
  preview,
  onRun,
  onCancel,
}: {
  preview: ActionPreviewEvent;
  onRun: () => void;
  onCancel: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const pieceName = preview.pieceName
    ? normalizePieceName(preview.pieceName)
    : null;
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName ?? '' });
  const inputParams = buildInputParams(preview.input);

  const batchSamples = preview.batchSamples ?? [];
  const totalBatchCount = preview.batchCount ?? batchSamples.length;

  const title =
    preview.isBatch && preview.batchCount !== undefined
      ? t('{actionDisplayName} · {count} items', {
          actionDisplayName: preview.actionDisplayName,
          count: preview.batchCount,
        })
      : preview.actionDisplayName;

  const meta = [
    pieceName ? summary?.displayName : undefined,
    preview.connectionLabel,
    preview.taskTitle
      ? t('Asked by {taskTitle}', { taskTitle: preview.taskTitle })
      : undefined,
  ]
    .filter((part): part is string => !!part)
    .join(' · ');

  const hasBody = preview.isBatch
    ? batchSamples.length > 0
    : inputParams.length > 0;

  const handle = (callback: () => void) => {
    if (submitted) return;
    setSubmitted(true);
    callback();
  };

  return (
    <ChatCard turn>
      <ChatCardHeader
        tile={
          pieceName ? (
            <ChatCardTile kind="app" pieceName={pieceName} />
          ) : (
            <ChatCardTile kind="bits" icon={Zap} />
          )
        }
        title={title}
        meta={meta || undefined}
      />
      {hasBody && (
        <ChatCardBody>
          {preview.isBatch ? (
            <BatchTable samples={batchSamples} totalCount={totalBatchCount} />
          ) : (
            <ChatKeyValue
              rows={inputParams.map((param) => ({
                label: param.key,
                value:
                  param.kind === 'scalar' ? (
                    param.text
                  ) : (
                    <ExpandableValue param={param} />
                  ),
              }))}
            />
          )}
        </ChatCardBody>
      )}
      <ChatCardActions>
        <Button
          size="sm"
          type="button"
          disabled={submitted}
          onClick={() => handle(onRun)}
        >
          {preview.actionDisplayName}
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={submitted}
          onClick={() => handle(onCancel)}
        >
          {t('Cancel')}
        </Button>
      </ChatCardActions>
    </ChatCard>
  );
}

function ExpandableValue({ param }: { param: RichInputParam }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-gray-11 transition-colors hover:text-gray-12"
        >
          {open ? t('Hide') : t('Preview')}
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {param.kind === 'html' ? (
          <div className="mt-2">
            <HtmlPreview html={param.value} label={param.key} />
          </div>
        ) : (
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-2 px-3 py-2 text-xs text-gray-12">
            {param.value}
          </pre>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function BatchTable({
  samples,
  totalCount,
}: {
  samples: Record<string, unknown>[];
  totalCount: number;
}) {
  const rows = samples.map((sample) => buildInputParams(sample));
  const columns = Array.from(
    new Set(rows.flatMap((params) => params.map((param) => param.key))),
  );
  const remaining = totalCount - samples.length;

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-gray-5">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-2 text-xs text-gray-11">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-normal">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-4 border-t border-gray-4">
          {rows.map((params, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => {
                const text = cellText(params.find((p) => p.key === column));
                return (
                  <td key={column} className="max-w-60 px-3 py-2 text-gray-12">
                    <TextWithTooltip tooltipMessage={text}>
                      <p className="truncate">{text}</p>
                    </TextWithTooltip>
                  </td>
                );
              })}
            </tr>
          ))}
          {remaining > 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-2 text-gray-11">
                {t('and {count} more', { count: remaining })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function cellText(param: InputParam | undefined): string {
  if (!param) return '';
  return param.kind === 'scalar' ? param.text : param.value;
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
