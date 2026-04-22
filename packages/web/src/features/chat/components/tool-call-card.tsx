import { t } from 'i18next';
import { Check, ChevronDown, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import type { ToolCallItem } from '../lib/use-chat';

function formatToolName(raw: string): string {
  let name = raw;
  const mcpMatch = /^mcp__[^_]+__(.+)$/.exec(name);
  if (mcpMatch) {
    name = mcpMatch[1];
  }
  return name.replace(/^ap_/, '').replaceAll('_', ' ');
}

function StatusIcon({ status }: { status: ToolCallItem['status'] }) {
  switch (status) {
    case 'running':
      return (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
      );
    case 'completed':
      return (
        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
      );
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  }
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCallItem }) {
  const displayName = formatToolName(toolCall.title || toolCall.name);
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
