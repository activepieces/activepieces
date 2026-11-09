import { t } from 'i18next';
import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import {
  ResourceKind,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';

// "Chat finished editing this …" for a moment after a followed edit ends on
// the page the user is looking at.
export function FollowFinishedNote() {
  const { pathname } = useLocation();
  const phase = useFollowAlong((s) => s.phase);
  const [finished, setFinished] = useState<ResourceKind | null>(null);
  const wasEditing = useRef(phase === 'editing');

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
          className="flex items-center gap-1.5 px-1 text-xs text-gray-11"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
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
