import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ChevronDown, Code2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { cn } from '@/lib/utils';

import { previewUtils } from './previews/preview-utils';

export function CodeModeCard({ part }: { part: AnyToolPart }) {
  const data = useMemo(() => readCodeModeContent(part), [part]);
  const parsedResult = useMemo(() => {
    if (!data?.resultText) return undefined;
    const parsed = previewUtils.parseJsonSafe(data.resultText);
    return parsed.ok ? parsed.value : data.resultText;
  }, [data]);
  const [open, setOpen] = useState(false);

  if (!data) return null;

  const title =
    data.reason && data.reason.trim().length > 0
      ? data.reason
      : t('Ran a multi-step task');
  const meta = buildMetaLine(data);
  const hasDetails =
    Boolean(data.code) ||
    (data.ok && parsedResult !== undefined) ||
    (!data.ok && Boolean(data.error));

  return (
    <div className="py-1">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div
          className={cn(
            'inline-flex max-w-full items-center gap-2 rounded-lg border border-border px-4 py-1.5 text-sm',
            hasDetails && 'cursor-pointer',
          )}
          onClick={() => hasDetails && setOpen(!open)}
        >
          {data.ok ? (
            <Code2 className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <X
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={2.5}
            />
          )}
          <TextWithTooltip tooltipMessage={title}>
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {title}
            </span>
          </TextWithTooltip>
          {meta && (
            <span className="shrink-0 text-xs text-muted-foreground/70">
              {meta}
            </span>
          )}
          {hasDetails && (
            <ChevronDown
              className={cn(
                'size-3 shrink-0 opacity-50 transition-transform duration-300',
                open && 'rotate-180',
              )}
            />
          )}
        </div>

        {hasDetails && (
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="mt-1 space-y-2 rounded-lg bg-muted/30 px-3 py-2 text-[11px]">
              <p className="text-muted-foreground/70">
                {buildDetailLine(data)}
              </p>
              {data.code && (
                <pre className="max-h-72 overflow-auto rounded-md bg-muted/40 px-3 py-2 font-mono leading-relaxed text-foreground/80">
                  {data.code}
                </pre>
              )}
              {data.ok && parsedResult !== undefined && (
                <div className="overflow-hidden rounded-md bg-muted/40">
                  <SimpleJsonViewer
                    data={parsedResult}
                    hideCopyButton={true}
                    maxHeight={220}
                    fontSize="11px"
                  />
                </div>
              )}
              {!data.ok && data.error && (
                <p className="leading-relaxed text-muted-foreground/80 break-words">
                  {data.error}
                </p>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
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

function buildMetaLine(data: CodeModeContent): string {
  if (data.bridgedCallCount <= 0) return t('ran as code');
  return t(
    'ran as code · {count, plural, =1 {1 tool call} other {# tool calls}}',
    { count: data.bridgedCallCount },
  );
}

function buildDetailLine(data: CodeModeContent): string {
  return t(
    '{count, plural, =1 {1 tool call} other {# tool calls}} · {serverKb} processed server-side · {returnedKb} returned',
    {
      count: data.bridgedCallCount,
      serverKb: chatUtils.formatKbBytes(data.serverSideBytes),
      returnedKb: chatUtils.formatKbBytes(data.returnedBytes),
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
