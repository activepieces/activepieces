import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { AlertCircle, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { TextShimmer } from '@/components/ui/text-shimmer';
import {
  AnyToolPart,
  CardSkeletonPhase,
  PendingCardKind,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

export function CardSkeleton({
  cardKind,
  phase,
  part,
  description,
}: {
  cardKind: PendingCardKind;
  phase: CardSkeletonPhase;
  part: AnyToolPart;
  description: string | null;
}) {
  const isPending = phase === 'pending';
  const { revealed, isLong } = useSkeletonReveal(isPending);

  if (phase === 'failed') {
    return <CardSkeletonFailed cardKind={cardKind} />;
  }
  // Hold a beat before painting the skeleton so sub-250ms tools never flash one.
  if (!revealed) return null;

  const label = isLong ? t('Still working…') : labelForCard({ cardKind, part });

  if (cardKind === 'image') {
    return <GeneratedImageCardSkeleton label={description ?? label} />;
  }
  return <ActionReceiptCardSkeleton label={description ?? label} part={part} />;
}

const REVEAL_DELAY_MS = 250;
const LONG_RUNNING_MS = 10_000;

function useSkeletonReveal(active: boolean) {
  const [revealed, setRevealed] = useState(!active);
  const [isLong, setIsLong] = useState(false);

  useEffect(() => {
    if (!active) {
      setRevealed(true);
      setIsLong(false);
      return;
    }
    const revealTimer = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    const longTimer = setTimeout(() => setIsLong(true), LONG_RUNNING_MS);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(longTimer);
    };
  }, [active]);

  return { revealed, isLong };
}

function labelForCard({
  cardKind,
  part,
}: {
  cardKind: PendingCardKind;
  part: AnyToolPart;
}): string {
  const { activeTitle } = chatPartUtils.extractToolTitles(part);
  if (activeTitle) return activeTitle;
  if (cardKind === 'image') return t('Generating image…');
  return chatUtils.formatToolActionName({ part });
}

function GeneratedImageCardSkeleton({ label }: { label: string }) {
  return (
    <motion.div
      className="my-2 max-w-md overflow-hidden rounded-xl border bg-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex items-center justify-between gap-2 p-2">
        <TextShimmer
          as="span"
          className="min-w-0 truncate text-xs text-muted-foreground"
          duration={2}
        >
          {label}
        </TextShimmer>
        <ImageIcon className="size-4 shrink-0 text-muted-foreground/50" />
      </div>
    </motion.div>
  );
}

function ActionReceiptCardSkeleton({
  label,
  part,
}: {
  label: string;
  part: AnyToolPart;
}) {
  const input = isObject(part.input)
    ? (part.input as Record<string, unknown>)
    : undefined;
  const pieceName = chatPartUtils.extractPieceNames(input)[0];

  return (
    <motion.div
      className="my-2 overflow-hidden rounded-xl border bg-background"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="px-3.5 pb-2.5 pt-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {pieceName ? (
            <PieceIconWithPieceName
              pieceName={pieceName}
              size="xs"
              border={false}
              showTooltip={false}
            />
          ) : (
            <Skeleton className="size-6 shrink-0 rounded-md" />
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <TextShimmer
              as="div"
              className="truncate text-xs font-medium"
              duration={2}
            >
              {label}
            </TextShimmer>
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CardSkeletonFailed({ cardKind }: { cardKind: PendingCardKind }) {
  return (
    <motion.div
      className="my-2 flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 text-muted-foreground"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AlertCircle className="size-4 shrink-0 text-muted-foreground/70" />
      <span className="text-xs">
        {cardKind === 'image'
          ? t("Couldn't generate the image")
          : t("This step didn't complete")}
      </span>
    </motion.div>
  );
}
