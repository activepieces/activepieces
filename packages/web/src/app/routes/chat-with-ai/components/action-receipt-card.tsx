import { ActionReceiptEvent } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  TriangleAlert,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

import { normalizePieceName } from '../lib/message-parsers';

export function ActionReceiptCard({
  receipt,
}: {
  receipt: ActionReceiptEvent;
}) {
  const [outputOpen, setOutputOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const pieceName = normalizePieceName(receipt.pieceName);
  const hasOutput = receipt.output != null;
  const formattedTimestamp = formatTimestamp(receipt.timestamp);

  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
              <StatusBadge status={receipt.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {formattedTimestamp}
              </span>
            </div>
          </div>
        </div>
      </div>

      {receipt.status === 'failed' && receipt.errorMessage && (
        <p className="px-3.5 pb-2.5 text-xs leading-relaxed text-destructive-700 dark:text-destructive-200 break-words">
          {receipt.errorMessage}
        </p>
      )}

      {hasOutput && (
        <div className="px-3.5 pb-3">
          <Collapsible open={outputOpen} onOpenChange={setOutputOpen}>
            <CollapsibleTrigger className="flex min-h-9 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {outputOpen ? (
                <>
                  <ChevronUp className="size-3" aria-hidden={true} />
                  {t('Hide output')}
                </>
              ) : (
                <>
                  <ChevronDown className="size-3" aria-hidden={true} />
                  {t('Show output')}
                </>
              )}
            </CollapsibleTrigger>
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

function StatusBadge({
  status,
}: {
  status: 'success' | 'failed' | 'declined' | 'timed_out';
}) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700 dark:text-success-400">
        <Check className="size-3.5 shrink-0" aria-hidden={true} />
        {t('Action completed')}
      </span>
    );
  }
  if (status === 'declined') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Ban className="size-3.5 shrink-0" aria-hidden={true} />
        {t('You said no — nothing ran')}
      </span>
    );
  }
  if (status === 'timed_out') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700 dark:text-warning-300">
        <Clock className="size-3.5 shrink-0" aria-hidden={true} />
        {t('Waited for your answer — nothing ran')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive-700 dark:text-destructive-200">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden={true} />
      {t("Didn't go through")}
    </span>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return time;
  }
  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${day}, ${time}`;
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
