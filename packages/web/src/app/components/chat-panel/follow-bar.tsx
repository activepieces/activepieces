import { t } from 'i18next';
import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';

import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import {
  FollowResourceKind,
  followResources,
} from '@/features/chat/lib/follow/follow-resources';

// A quiet strip at the top of the page the chat is editing.
export function FollowBar() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const target = useFollowAlong((s) => s.target);
  const phase = useFollowAlong((s) => s.phase);
  const following = useFollowAlong((s) => s.following);
  const visible =
    target !== null &&
    following &&
    phase !== 'idle' &&
    followResources.isOn(pathname, target);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="follow-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
          }
          className="shrink-0 overflow-hidden"
        >
          <div
            role="status"
            aria-live="polite"
            className="flex h-8 items-center gap-2 border-b bg-gray-2 px-4 text-xs"
          >
            {phase === 'editing' ? (
              <LiveDot />
            ) : (
              <Check className="size-3.5 text-gray-11" aria-hidden />
            )}
            <span className="text-gray-12">
              {phase === 'editing'
                ? EDITING_LABEL[target.kind]()
                : DONE_LABEL[target.kind]()}
            </span>
            {phase === 'editing' && (
              <button
                type="button"
                onClick={followAlong.stopFollowing}
                className="ml-auto rounded-sm text-gray-11 underline-offset-2 transition-colors hover:text-gray-12 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8"
              >
                {t('Stop following')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-2 shrink-0" aria-hidden>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-9 opacity-30 [animation-duration:1.8s] motion-reduce:animate-none" />
      <span className="relative inline-flex size-2 rounded-full bg-accent-9" />
    </span>
  );
}

const EDITING_LABEL: Record<FollowResourceKind, () => string> = {
  flow: () => t('Chat is editing this flow'),
  table: () => t('Chat is editing this table'),
  agent: () => t('Chat is editing this agent'),
};

const DONE_LABEL: Record<FollowResourceKind, () => string> = {
  flow: () => t('Chat finished editing this flow'),
  table: () => t('Chat finished editing this table'),
  agent: () => t('Chat finished editing this agent'),
};
