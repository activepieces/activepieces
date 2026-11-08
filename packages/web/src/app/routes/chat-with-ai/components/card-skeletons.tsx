import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ImageIcon, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  AnyToolPart,
  CardSkeletonPhase,
  PendingCardKind,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import {
  ChatCard,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatStatusText } from './chat-ui/chat-status';

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
  const { revealed, isLong } = useSkeletonReveal(phase === 'pending');
  const pieceName = chatPartUtils.extractPieceNames(
    isObject(part.input) ? part.input : undefined,
  )[0];
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName ?? '' });

  if (!revealed) return null;

  const isImage = cardKind === 'image';
  const tile =
    pieceName && !isImage ? (
      <ChatCardTile kind="app" pieceName={pieceName} />
    ) : (
      <ChatCardTile kind="bits" icon={isImage ? ImageIcon : Zap} />
    );

  if (phase === 'failed') {
    return (
      <ChatCard className={isImage ? 'max-w-md' : undefined}>
        <ChatCardHeader
          tile={tile}
          title={
            isImage
              ? t("Couldn't generate the image")
              : t("This step didn't complete")
          }
          meta={joinMeta([summary?.displayName, failureReason(part)])}
          trailing={<ChatStatusText status="failed" />}
        />
      </ChatCard>
    );
  }

  return (
    <ChatCard className={isImage ? 'max-w-md' : undefined}>
      <ChatCardHeader
        tile={tile}
        title={description ?? labelForCard({ cardKind, part })}
        meta={isLong ? t('Still working…') : summary?.displayName}
        trailing={<ChatStatusText status="working" />}
      />
      <ChatCardBody>
        {isImage ? (
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        ) : (
          <Skeleton className="h-2.5 w-28" />
        )}
      </ChatCardBody>
    </ChatCard>
  );
}

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

function failureReason(part: AnyToolPart): string | undefined {
  return part.state === 'output-error' ? part.errorText : undefined;
}

function joinMeta(values: Array<string | undefined>): string | undefined {
  const parts = values.filter((value): value is string => Boolean(value));
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

const REVEAL_DELAY_MS = 250;
const LONG_RUNNING_MS = 10_000;
