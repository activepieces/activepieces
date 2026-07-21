import { ActionReceiptEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';
import { deriveReceiptLabel } from '../lib/receipt-label';

import { ReceiptOutputBody } from './receipt-output';

export function ReceiptListGroup({
  receipts,
}: {
  receipts: ActionReceiptEvent[];
}) {
  if (receipts.length > RECEIPT_INLINE_MAX) {
    return <CollapsedReceiptList receipts={receipts} />;
  }
  return <ReceiptList receipts={receipts} showHeader={true} />;
}

function CollapsedReceiptList({
  receipts,
}: {
  receipts: ActionReceiptEvent[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{t('chatOutcomeCount', { count: receipts.length })}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 opacity-50 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="mt-2">
          <ReceiptList receipts={receipts} showHeader={false} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReceiptList({
  receipts,
  showHeader,
}: {
  receipts: ActionReceiptEvent[];
  showHeader: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sharedPiece = receipts.every(
    (receipt) => receipt.pieceName === receipts[0].pieceName,
  )
    ? normalizePieceName(receipts[0].pieceName)
    : null;

  return (
    <motion.div
      className="overflow-hidden rounded-xl border bg-background"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showHeader ? (
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2">
          {sharedPiece ? (
            <PieceIconWithPieceName
              pieceName={sharedPiece}
              size="xs"
              border={false}
              showTooltip={false}
            />
          ) : null}
          <span className="text-xs font-medium text-muted-foreground">
            {t('chatOutcomeCount', { count: receipts.length })}
          </span>
        </div>
      ) : null}
      <div className="divide-y divide-border">
        {receipts.map((receipt, index) => (
          <ReceiptRow
            key={`${receipt.toolCallId}-${index}`}
            receipt={receipt}
            open={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ReceiptRow({
  receipt,
  open,
  onToggle,
}: {
  receipt: ActionReceiptEvent;
  open: boolean;
  onToggle: () => void;
}) {
  const pieceName = normalizePieceName(receipt.pieceName);
  const label = deriveReceiptLabel(receipt);
  const hasError = receipt.status === 'failed' && receipt.errorMessage != null;
  const hasDetails = receipt.output != null || hasError;

  return (
    <div>
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        className={cn(
          'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left',
          hasDetails ? 'transition-colors hover:bg-muted/40' : 'cursor-default',
        )}
      >
        <PieceIconWithPieceName
          pieceName={pieceName}
          size="xs"
          border={false}
          showTooltip={false}
        />
        <div className="min-w-0 flex-1">
          <TextWithTooltip tooltipMessage={label}>
            <p className="text-xs font-medium text-foreground">{label}</p>
          </TextWithTooltip>
        </div>
        <StatusIndicator isSuccess={receipt.status === 'success'} />
        {hasDetails ? (
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-300',
              open && 'rotate-180',
            )}
          />
        ) : null}
      </button>
      {hasDetails ? (
        <Collapsible open={open}>
          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <div className="px-3.5 pb-3 pt-0.5">
              {hasError ? (
                <p className="mb-2 break-words text-[11px] leading-relaxed text-muted-foreground/70">
                  {receipt.errorMessage}
                </p>
              ) : null}
              <ReceiptOutputBody output={receipt.output} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

function StatusIndicator({ isSuccess }: { isSuccess: boolean }) {
  if (isSuccess) {
    return (
      <span
        className="inline-flex shrink-0 items-center text-green-600 dark:text-green-400"
        title={t('Action completed')}
      >
        <Check className="size-3.5" />
        <span className="sr-only">{t('Action completed')}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center text-muted-foreground/70"
      title={t("Didn't go through")}
    >
      <X className="size-3.5" />
      <span className="sr-only">{t("Didn't go through")}</span>
    </span>
  );
}

const RECEIPT_INLINE_MAX = 8;
