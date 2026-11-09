import { t } from 'i18next';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import { chatNote } from './follow-finished-note';

export function FollowOfferRow() {
  const offer = useFollowAlong((s) => s.offer);
  const conversationId = useChatPanel((s) => s.conversationId);
  const reduced = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {offer && offer.conversationId === conversationId && (
        <motion.div
          key="follow-offer"
          role="status"
          className="flex flex-wrap items-center gap-2 px-1 text-sm text-gray-11"
          {...chatNote.motion(reduced)}
        >
          <span className="min-w-0 flex-1">
            {t('The AI is editing {name}.', { name: offer.resource.name })}
          </span>
          <Button variant="outline" size="xs" onClick={followAlong.acceptOffer}>
            {t('Open beside')}
          </Button>
          <Button variant="ghost" size="xs" onClick={followAlong.stopFollowing}>
            {t('Stay here')}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
