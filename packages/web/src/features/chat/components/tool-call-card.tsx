import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, Loader2, Pause, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DynamicToolPart } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { cn } from '@/lib/utils';

type ToolStatus = 'running' | 'completed' | 'failed' | 'stopped';

function deriveStatus(part: DynamicToolPart): ToolStatus {
  if (part.state === 'output-available') return 'completed';
  if (part.state === 'output-error') return 'failed';
  if (part.state === 'output-denied') return 'stopped';
  return 'running';
}

function extractOutput(part: DynamicToolPart): string | undefined {
  if (part.state === 'output-available' && part.output !== undefined) {
    return typeof part.output === 'string'
      ? part.output
      : JSON.stringify(part.output);
  }
  if (part.state === 'output-error' && part.errorText) {
    return part.errorText;
  }
  return undefined;
}

function StatusIcon({ status }: { status: ToolStatus }) {
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
        <Pause className="h-3.5 w-3.5 text-muted-foreground shrink-0 fill-current" />
      );
  }
}

export function ToolCallCard({ toolPart }: { toolPart: DynamicToolPart }) {
  const status = deriveStatus(toolPart);
  const output = extractOutput(toolPart);
  const input = isObject(toolPart.input) ? toolPart.input : undefined;
  const displayName = chatUtils.formatToolLabel({ part: toolPart });
  const hasInput = input && Object.keys(input).length > 0;
  const hasOutput = Boolean(output);
  const hasContent = hasInput || hasOutput;
  const [open, setOpen] = useState(false);

  if (!hasContent) {
    return (
      <div className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
        <StatusIcon status={status} />
        <span>{displayName}</span>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <StatusIcon status={status} />
        <span className="flex-1 text-left">{displayName}</span>
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="ml-5 mt-1 mb-1 space-y-1.5 rounded-md bg-muted/40 p-2.5 text-xs">
          {hasInput && input && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">
                {t('Input')}
              </p>
              <pre className="font-mono whitespace-pre-wrap break-words text-foreground/80">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {hasOutput && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">
                {t('Output')}
              </p>
              <pre className="font-mono whitespace-pre-wrap break-words text-foreground/80 max-h-48 overflow-auto">
                {output}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
