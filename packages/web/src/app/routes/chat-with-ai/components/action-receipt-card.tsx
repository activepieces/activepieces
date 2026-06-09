import { ActionReceiptEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';

export function ActionReceiptCard({
  receipt,
}: {
  receipt: ActionReceiptEvent;
}) {
  const [outputOpen, setOutputOpen] = useState(false);

  const pieceName = normalizePieceName(receipt.pieceName);
  const isSuccess = receipt.status === 'success';
  const hasOutput = receipt.output != null;
  const formattedTimestamp = formatTimestamp(receipt.timestamp);

  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="xs"
            border={false}
            showTooltip={false}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-foreground truncate">
                {receipt.actionDisplayName}
              </span>
              <StatusBadge isSuccess={isSuccess} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {receipt.connectionLabel && (
                <span className="text-xs text-muted-foreground">
                  {t('via {connectionLabel}', {
                    connectionLabel: receipt.connectionLabel,
                  })}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formattedTimestamp}
              </span>
            </div>
          </div>
        </div>
      </div>

      {receipt.status === 'failed' && receipt.errorMessage && (
        <div className="mx-3.5 mb-2 rounded-lg bg-destructive/5 px-3 py-2">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive break-words min-w-0">
              {receipt.errorMessage}
            </p>
          </div>
        </div>
      )}

      {hasOutput && (
        <div className="px-3.5 pb-3">
          <Collapsible open={outputOpen} onOpenChange={setOutputOpen}>
            <button
              type="button"
              onClick={() => setOutputOpen(!outputOpen)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {outputOpen ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  {t('Hide output')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  {t('Show output')}
                </>
              )}
            </button>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="mt-1.5 rounded-lg bg-muted/30 overflow-hidden">
                <SimpleJsonViewer
                  data={tryParseJson(receipt.output)}
                  hideCopyButton={true}
                  maxHeight={150}
                  fontSize="11px"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ isSuccess }: { isSuccess: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isSuccess ? 'text-green-600 dark:text-green-400' : 'text-destructive',
      )}
    >
      {isSuccess ? (
        <>
          <Check className="h-3 w-3" />
          {t('Action completed')}
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          {t('Action failed')}
        </>
      )}
    </span>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tryParseJson(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
