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
          className="flex flex-col items-start gap-2 text-sm text-gray-11 @chat-sm/chat:flex-row @chat-sm/chat:items-center"
          {...chatNote.motion(reduced)}
        >
          <span className="min-w-0 @chat-sm/chat:flex-1">
            {t('The AI is editing {name}.', { name: offer.resource.name })}
          </span>
          <div className="flex max-w-full items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-w-0 max-w-full shrink"
              onClick={followAlong.acceptOffer}
            >
              <span className="truncate">
                {t('Open {name} beside the chat', {
                  name: offer.resource.name,
                })}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={followAlong.stopFollowing}
            >
              {t('Stay here')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
