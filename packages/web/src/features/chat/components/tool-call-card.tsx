import { isObject, ToolCallItem } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, Loader2, Square, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

function humanizePieceName(raw: string): string {
  return raw
    .replace(/^@activepieces\/piece-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeSnakeCase(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractToolContext(tc: ToolCallItem): string | null {
  const input = tc.input;
  if (!input) return null;
  const parts: string[] = [];

  if (typeof input.pieceName === 'string') {
    parts.push(humanizePieceName(input.pieceName));
  }
  if (typeof input.actionName === 'string' && input.actionName) {
    parts.push(humanizeSnakeCase(input.actionName));
  } else if (typeof input.displayName === 'string' && input.displayName) {
    parts.push(input.displayName);
  }
  if (typeof input.triggerName === 'string' && input.triggerName) {
    parts.push(humanizeSnakeCase(input.triggerName));
  }
  if (typeof input.flowId === 'string' && parts.length === 0) {
    parts.push(input.flowId.slice(0, 8));
  }
  if (typeof input.query === 'string' && parts.length === 0) {
    parts.push(
      `"${input.query.slice(0, 30)}${input.query.length > 30 ? '…' : ''}"`,
    );
  }
  if (
    isObject(input.settings) &&
    typeof input.settings.pieceName === 'string' &&
    parts.length === 0
  ) {
    parts.push(humanizePieceName(input.settings.pieceName));
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

function formatToolLabel(toolCall: ToolCallItem): string {
  const raw = toolCall.title || toolCall.name;
  const mcpMatch = /^mcp__[^_]+__(.+)$/.exec(raw);
  const name = mcpMatch ? mcpMatch[1] : raw;
  const baseName = formatUtils.convertEnumToHumanReadable(
    name.replace(/^ap_/, ''),
  );

  const context = extractToolContext(toolCall);
  if (!context) return baseName;
  return `${baseName} — ${context}`;
}

function StatusIcon({ status }: { status: ToolCallItem['status'] }) {
  switch (status) {
    case 'running':
      return (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
      );
    case 'completed':
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="shrink-0 flex items-center justify-center"
        >
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </motion.span>
      );
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    case 'stopped':
      return (
        <Square className="h-3 w-3 text-muted-foreground shrink-0 fill-current" />
      );
  }
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCallItem }) {
  const displayName = formatToolLabel(toolCall);
  const hasInput = toolCall.input && Object.keys(toolCall.input).length > 0;
  const hasOutput = Boolean(toolCall.output);
  const hasContent = hasInput || hasOutput;
  const [open, setOpen] = useState(false);

  if (!hasContent) {
    return (
      <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
        <StatusIcon status={toolCall.status} />
        <span>{displayName}</span>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <StatusIcon status={toolCall.status} />
        <span className="flex-1 text-left">{displayName}</span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="ml-5 mt-1 mb-1 space-y-1.5 rounded-md bg-muted/40 p-2.5 text-xs">
          {hasInput && toolCall.input && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">
                {t('Input')}
              </p>
              <pre className="font-mono whitespace-pre-wrap break-words text-foreground/80">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {hasOutput && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">
                {t('Output')}
              </p>
              <pre className="font-mono whitespace-pre-wrap break-words text-foreground/80 max-h-48 overflow-auto">
                {toolCall.output}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
