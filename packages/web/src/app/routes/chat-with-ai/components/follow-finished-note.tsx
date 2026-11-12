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

export function FollowFinishedNote() {
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [finished, setFinished] = useState<FinishedEdit | null>(null);

  useEffect(
    () =>
      useFollowAlong.subscribe((state, previous) => {
        if (previous.phase !== 'editing' || state.phase !== 'idle') return;
        const { target, following } = state;
        if (!target || !following) return;
        if (
          !resourceRegistry.isOn({ pathname: pathnameRef.current, ref: target })
        ) {
          return;
        }
        setFinished((current) => ({
          kind: target.kind,
          id: (current?.id ?? 0) + 1,
        }));
      }),
    [],
  );

  if (finished === null) return null;
  return <FinishedNote key={finished.id} kind={finished.kind} />;
}

function FinishedNote({ kind }: { kind: ResourceKind }) {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), FINISHED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="follow-finished"
          role="status"
          aria-live="polite"
          className={NOTE_CLASS}
          {...noteMotion(reduced)}
        >
          <Check className="size-3.5" aria-hidden />
          {DONE_LABEL[kind]()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const DONE_LABEL: Record<ResourceKind, () => string> = {
  flow: () => t('The AI finished editing this flow.'),
  table: () => t('The AI finished editing this table.'),
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

type FinishedEdit = { kind: ResourceKind; id: number };

export const chatNote = { motion: noteMotion, CLASS: NOTE_CLASS };
