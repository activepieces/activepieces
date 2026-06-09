import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { cn } from '@/lib/utils';

export function ToolCallCard({ toolPart }: { toolPart: AnyToolPart }) {
  const status = chatPartUtils.deriveToolStatus(toolPart);
  const output = chatPartUtils.extractToolOutputText(toolPart);
  const input = isObject(toolPart.input) ? toolPart.input : undefined;
  const displayName = chatUtils.formatToolLabel({ part: toolPart });
  const hasInput = input && Object.keys(input).length > 0;
  const hasOutput = Boolean(output);
  const hasContent = hasInput || hasOutput;
  const [open, setOpen] = useState(false);

  const label =
    status === 'running' ? (
      <TextShimmer className="text-sm" duration={2}>
        {displayName}
      </TextShimmer>
    ) : (
      <span
        className={cn(
          'text-sm',
          status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {displayName}
      </span>
    );

  if (!hasContent) {
    return <div className="flex items-center gap-2 py-0.5">{label}</div>;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {label}
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="ml-5 mt-1 mb-1 space-y-1.5 rounded-md bg-muted/40 p-2.5 text-sm">
          {hasInput && input && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">
                {t('Input')}
              </p>
              <pre className="font-mono whitespace-pre-wrap break-words text-foreground/80 text-xs">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {hasOutput && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">
                {t('Output')}
              </p>
              <pre className="font-mono whitespace-pre-wrap break-words text-foreground/80 max-h-48 overflow-auto text-xs">
                {output}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
