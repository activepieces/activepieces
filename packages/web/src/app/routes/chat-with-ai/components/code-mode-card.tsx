import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  Archive,
  Braces,
  ChevronDown,
  Code2,
  TriangleAlert,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

import { previewUtils } from './previews/preview-utils';

export function CodeModeCard({ part }: { part: AnyToolPart }) {
  const data = useMemo(() => readCodeModeContent(part), [part]);
  const parsedResult = useMemo(() => {
    if (!data?.resultText) return undefined;
    const parsed = previewUtils.parseJsonSafe(data.resultText);
    return parsed.ok ? parsed.value : data.resultText;
  }, [data]);
  const [codeOpen, setCodeOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  if (!data) return null;

  const savings = buildSavingsLine(data);

  return (
    <motion.div
      className="my-2 overflow-hidden rounded-xl border bg-background"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-2.5 px-3.5 pb-2.5 pt-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Braces className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t('Code Mode')}
            </span>
            {!data.ok && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <TriangleAlert className="size-3" />
                {t('Failed')}
              </span>
            )}
          </div>
          {data.reason && (
            <TextWithTooltip tooltipMessage={data.reason}>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.reason}
              </p>
            </TextWithTooltip>
          )}
        </div>
      </div>

      {data.ok && (
        <div className="flex items-center gap-1.5 px-3.5 pb-2.5 text-xs text-muted-foreground">
          <Archive className="size-3 shrink-0 text-primary/70" />
          <span className="min-w-0">{savings}</span>
        </div>
      )}

      {data.code && (
        <div className="px-3.5 pb-2.5">
          <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
            <button
              type="button"
              onClick={() => setCodeOpen(!codeOpen)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Code2 className="size-3 shrink-0" />
              {codeOpen ? t('Hide code') : t('View code')}
              <ChevronDown
                className={cn(
                  'size-3 shrink-0 opacity-60 transition-transform duration-300',
                  codeOpen && 'rotate-180',
                )}
              />
            </button>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <pre className="mt-1.5 max-h-72 overflow-auto rounded-lg bg-muted/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/80">
                {data.code}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {data.ok && parsedResult !== undefined ? (
        <div className="border-t border-border/60 px-3.5 py-3">
          <Collapsible open={resultOpen} onOpenChange={setResultOpen}>
            <button
              type="button"
              onClick={() => setResultOpen(!resultOpen)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  'size-3 shrink-0 opacity-60 transition-transform duration-300',
                  resultOpen && 'rotate-180',
                )}
              />
              {resultOpen ? t('Hide result') : t('Show result')}
            </button>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="mt-1.5 overflow-hidden rounded-lg bg-muted/30">
                <SimpleJsonViewer
                  data={parsedResult}
                  hideCopyButton={true}
                  maxHeight={220}
                  fontSize="11px"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : null}

      {!data.ok && data.error && (
        <p className="border-t border-border/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground/80 break-words">
          {data.error}
        </p>
      )}
    </motion.div>
  );
}

function readCodeModeContent(part: AnyToolPart): CodeModeContent | null {
  const parsed = chatPartUtils.parseToolOutput(part);
  if (parsed.state !== 'success' || !isObject(parsed.data)) return null;
  const structured = (parsed.data as { structuredContent?: unknown })
    .structuredContent;
  if (!isObject(structured)) return null;
  const record = structured as Record<string, unknown>;
  if (record.kind !== 'code-mode') return null;
  return {
    ok: record.ok === true,
    code: typeof record.code === 'string' ? record.code : '',
    reason: typeof record.reason === 'string' ? record.reason : undefined,
    bridgedCallCount: numberOr(record.bridgedCallCount, 0),
    serverSideBytes: numberOr(record.serverSideBytes, 0),
    returnedBytes: numberOr(record.returnedBytes, 0),
    resultText:
      typeof record.resultText === 'string' ? record.resultText : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function formatKb(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  return kb < 1 ? '<1 KB' : `${Math.round(kb)} KB`;
}

function buildSavingsLine(data: CodeModeContent): string {
  return t(
    'Context compressed · ran {count, plural, =1 {1 tool call} other {# tool calls}} in code · ~{serverKb} processed server-side · ~{returnedKb} returned to context',
    {
      count: data.bridgedCallCount,
      serverKb: formatKb(data.serverSideBytes),
      returnedKb: formatKb(data.returnedBytes),
    },
  );
}

type CodeModeContent = {
  ok: boolean;
  code: string;
  reason?: string;
  bridgedCallCount: number;
  serverSideBytes: number;
  returnedBytes: number;
  resultText?: string;
  error?: string;
};
