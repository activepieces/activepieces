import { t } from 'i18next';
import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import {
  ResourceKind,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { MOTION } from '@/features/workspace/lib/chat-layout';

// "Chat finished editing this …" for a moment after a followed edit ends on
// the page the user is looking at.
export function FollowFinishedNote() {
  const { pathname } = useLocation();
  const phase = useFollowAlong((s) => s.phase);
  const [finished, setFinished] = useState<ResourceKind | null>(null);
  const wasEditing = useRef(phase === 'editing');
  const reduced = useReducedMotion();

  useEffect(() => {
    const was = wasEditing.current;
    wasEditing.current = phase === 'editing';
    if (!was || phase !== 'idle') return;
    const { target, following } = useFollowAlong.getState();
    if (target && following && resourceRegistry.isOn(pathname, target)) {
      setFinished(target.kind);
    }
  }, [phase, pathname]);

  useEffect(() => {
    if (finished === null) return;
    const timer = setTimeout(() => setFinished(null), FINISHED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [finished]);

  return (
    <AnimatePresence initial={false}>
      {finished !== null && (
        <motion.div
          key="follow-finished"
          role="status"
          aria-live="polite"
          className={NOTE_CLASS}
          {...noteMotion(reduced)}
        >
          <Check className="size-3.5" aria-hidden />
          {DONE_LABEL[finished]()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const DONE_LABEL: Record<ResourceKind, () => string> = {
  flow: () => t('Chat finished editing this flow'),
  table: () => t('Chat finished editing this table'),
};

const FINISHED_VISIBLE_MS = 2600;

function noteMotion(reduced: boolean | null) {
  const rise = reduced ? 0 : NOTE_RISE_PX;
  return {
    initial: { opacity: 0, y: rise },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION.base, ease: MOTION.easeOut },
    },
    exit: {
      opacity: 0,
      y: rise,
      transition: { duration: MOTION.fast, ease: MOTION.easeOut },
    },
  };
}

const NOTE_RISE_PX = 4;
const NOTE_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-full mb-2 flex items-center gap-1.5 bg-gray-1 px-1 text-xs text-gray-11';

export const chatNote = { motion: noteMotion, CLASS: NOTE_CLASS };
