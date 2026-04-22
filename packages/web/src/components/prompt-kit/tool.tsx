import {
  CheckCircle,
  ChevronDown,
  Loader2,
  Settings,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import { Markdown } from './markdown';

function getStateIcon(state: ToolPart['state']) {
  switch (state) {
    case 'input-streaming':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'input-available':
      return <Settings className="h-4 w-4 text-orange-500" />;
    case 'output-available':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'output-error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Settings className="text-muted-foreground h-4 w-4" />;
  }
}

function getStateBadge(state: ToolPart['state']) {
  const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-medium';
  switch (state) {
    case 'input-streaming':
      return (
        <span
          className={cn(
            baseClasses,
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          )}
        >
          Processing
        </span>
      );
    case 'input-available':
      return (
        <span
          className={cn(
            baseClasses,
            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
          )}
        >
          Ready
        </span>
      );
    case 'output-available':
      return (
        <span
          className={cn(
            baseClasses,
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          )}
        >
          Completed
        </span>
      );
    case 'output-error':
      return (
        <span
          className={cn(
            baseClasses,
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          Error
        </span>
      );
    default:
      return (
        <span
          className={cn(
            baseClasses,
            'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          )}
        >
          Pending
        </span>
      );
  }
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function Tool({ toolPart, defaultOpen = false, className }: ToolProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const { state, input, output } = toolPart;

  return (
    <div
      className={cn(
        'border-border overflow-hidden rounded-lg border',
        className,
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="bg-background h-auto w-full justify-between rounded-b-none px-3 py-2 font-normal"
          >
            <div className="flex items-center gap-2">
              {getStateIcon(state)}
              <span className="text-sm font-medium">{toolPart.type}</span>
              {getStateBadge(state)}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            'border-border border-t',
            'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden',
          )}
        >
          <div className="bg-background space-y-3 p-3">
            {input && Object.keys(input).length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">
                  Input
                </h4>
                <div className="bg-muted/40 rounded-md p-2 font-mono text-xs">
                  {Object.entries(input).map(([key, value]) => (
                    <div key={key} className="mb-0.5 last:mb-0">
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span>{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {output && (
              <div>
                <h4 className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">
                  Output
                </h4>
                {typeof output === 'string' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-auto rounded-md bg-muted/40 p-2 text-sm">
                    <Markdown>{output}</Markdown>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-xs">
                    <pre className="whitespace-pre-wrap">
                      {formatValue(output)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {state === 'output-error' && toolPart.errorText && (
              <div>
                <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-red-500">
                  Error
                </h4>
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm dark:border-red-950 dark:bg-red-900/20">
                  {toolPart.errorText}
                </div>
              </div>
            )}

            {state === 'input-streaming' && (
              <div className="text-muted-foreground text-sm">
                Processing tool call...
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export type ToolPart = {
  type: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: Record<string, unknown>;
  output?: string | Record<string, unknown>;
  toolCallId?: string;
  errorText?: string;
};

export type ToolProps = {
  toolPart: ToolPart;
  defaultOpen?: boolean;
  className?: string;
};

export { Tool };
