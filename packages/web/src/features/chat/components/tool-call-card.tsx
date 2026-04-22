import { t } from 'i18next';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Terminal,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import type { ToolCallItem } from '../lib/use-chat';

export function ToolCallCard({ toolCall }: { toolCall: ToolCallItem }) {
  const [expanded, setExpanded] = useState(toolCall.status === 'running');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (toolCall.status !== 'running') return;
    const start = Date.now();
    const interval = setInterval(
      () => setElapsed((Date.now() - start) / 1000),
      100,
    );
    return () => clearInterval(interval);
  }, [toolCall.status]);

  useEffect(() => {
    if (toolCall.status === 'running') {
      setExpanded(true);
    }
    if (toolCall.status === 'completed' || toolCall.status === 'failed') {
      const timer = setTimeout(() => setExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toolCall.status]);

  return (
    <div
      className={cn(
        'rounded-lg border bg-card my-2 transition-all duration-200',
        toolCall.status === 'running' &&
          'border-blue-500/30 shadow-sm shadow-blue-500/5',
        toolCall.status === 'completed' && 'border-green-500/20',
        toolCall.status === 'failed' && 'border-destructive/20',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm hover:bg-muted/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <StatusIcon status={toolCall.status} />
          <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{toolCall.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {toolCall.status === 'running' && elapsed > 0 && (
            <span className="text-xs text-blue-500 tabular-nums">
              {elapsed.toFixed(1)}s
            </span>
          )}
          {toolCall.status === 'completed' && elapsed > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {elapsed.toFixed(1)}s
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-3 pb-3 space-y-2 border-t border-border/50">
          {toolCall.input && (
            <div className="mt-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t('Input')}
              </p>
              <pre className="text-xs bg-muted/30 rounded-md p-2 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.output && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t('Output')}
              </p>
              <pre className="text-xs bg-muted/30 rounded-md p-2 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                {JSON.stringify(toolCall.output, null, 2)}
              </pre>
            </div>
          )}
          {!toolCall.input &&
            !toolCall.output &&
            toolCall.status === 'running' && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {t('Executing...')}
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ToolCallItem['status'] }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center h-5 w-5 rounded-full shrink-0 transition-colors',
        status === 'running' && 'text-blue-500 animate-pulse',
        status === 'completed' && 'text-green-500 bg-green-500/10',
        status === 'failed' && 'text-red-500 bg-red-500/10',
      )}
    >
      {status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === 'completed' && <Check className="h-3.5 w-3.5" />}
      {status === 'failed' && <X className="h-3.5 w-3.5" />}
    </div>
  );
}
