import { t } from 'i18next';
import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';

import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useAiFieldHighlights } from '@/features/chat/lib/follow/use-ai-highlight';
import {
  ResourceKind,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { cn } from '@/lib/utils';

export function FollowBar() {
  useAiFieldHighlights();
  const reduceMotion = useReducedMotion();
  const target = useFollowAlong((s) => s.target);
  const phase = useFollowAlong((s) => s.phase);
  const visible = useIsFollowedHere() && target !== null;

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
            <span className="min-w-0 truncate text-gray-12">
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

export function FollowEmptyState({
  kind,
  className,
}: {
  kind: ResourceKind;
  className?: string;
}) {
  const target = useFollowAlong((s) => s.target);
  const phase = useFollowAlong((s) => s.phase);
  const here = useIsFollowedHere();
  if (!here || phase !== 'editing' || target?.kind !== kind) return null;
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 text-sm text-gray-11',
        className,
      )}
    >
      <LiveDot />
      {FILLING_LABEL[kind]()}
    </div>
  );
}

function useIsFollowedHere(): boolean {
  const { pathname } = useLocation();
  const target = useFollowAlong((s) => s.target);
  const phase = useFollowAlong((s) => s.phase);
  const following = useFollowAlong((s) => s.following);
  return (
    target !== null &&
    following &&
    phase !== 'idle' &&
    resourceRegistry.isOn(pathname, target)
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

const EDITING_LABEL: Record<ResourceKind, () => string> = {
  flow: () => t('Chat is editing this flow'),
  table: () => t('Chat is editing this table'),
  agent: () => t('Chat is editing this agent'),
  run: () => t('Chat is working on this run'),
  connection: () => t('Chat is editing your connections'),
  folder: () => t('Chat is editing your automations'),
  'platform-settings': () => t('Chat is changing platform settings'),
  'project-settings': () => t('Chat is changing project settings'),
};

const DONE_LABEL: Record<ResourceKind, () => string> = {
  flow: () => t('Chat finished editing this flow'),
  table: () => t('Chat finished editing this table'),
  agent: () => t('Chat finished editing this agent'),
  run: () => t('Chat finished working on this run'),
  connection: () => t('Chat finished editing your connections'),
  folder: () => t('Chat finished editing your automations'),
  'platform-settings': () => t('Chat finished changing platform settings'),
  'project-settings': () => t('Chat finished changing project settings'),
};

const FILLING_LABEL: Record<ResourceKind, () => string> = {
  flow: () => t('Chat is adding steps…'),
  table: () => t('Chat is adding rows…'),
  agent: () => t('Chat is setting up this agent…'),
  run: () => t('Chat is starting this run…'),
  connection: () => t('Chat is adding a connection…'),
  folder: () => t('Chat is adding to your automations…'),
  'platform-settings': () => t('Chat is changing platform settings…'),
  'project-settings': () => t('Chat is changing project settings…'),
};
