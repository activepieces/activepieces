import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

import { ChatSparkIcon } from '@/components/icons/chat-spark';
import {
  FollowOffer,
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { getProjectName } from '@/features/projects';
import { projectCollection } from '@/features/projects/stores/project-collection';
import { chatTransitions } from '@/features/workspace/lib/chat-panel-open';

export function ChatOfferPill() {
  const ref = useRef<HTMLDivElement>(null);
  const [inPanel, setInPanel] = useState(false);
  const offer = useFollowAlong((s) => s.offer);
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    setInPanel(ref.current?.closest('[data-chat-root]') != null);
  }, []);

  const cached = offer
    ? queryClient.getQueryData([
        'chat-resource-name',
        offer.resource.kind,
        offer.resource.id,
      ])
    : null;
  const name = offer
    ? offer.resource.name ??
      (typeof cached === 'string' ? cached : null) ??
      resourceRegistry.kindInfo(offer.resource.kind).label
    : '';

  return (
    <div ref={ref} className="contents">
      <AnimatePresence initial={false}>
        {inPanel && offer && (
          <motion.div
            key={`${offer.kind}:${resourceRegistry.keyOf(offer.resource)}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <div
              role="status"
              className="flex h-8 max-w-full items-center gap-1 rounded-full border border-accent-6 bg-accent-2 pr-1 pl-3 text-sm text-gray-12 shadow-xs"
            >
              <ChatSparkIcon
                className="size-3.5 shrink-0 text-accent-11"
                strokeWidth={2}
              />
              <span className="ml-1 truncate">
                {offerLabel({ kind: offer.kind, name })}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (offer.kind !== 'project') {
                    followAlong.view(offer.resource);
                    return;
                  }
                  followAlong.offer(null);
                  chatTransitions.openBeside({
                    route: resourceRegistry.route(offer.resource),
                    push: true,
                    name,
                  });
                }}
                className="ml-1 h-6 shrink-0 rounded-full px-2.5 text-sm font-medium text-accent-11 transition-colors hover:bg-accent-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-8"
              >
                {actionLabel({
                  kind: offer.kind,
                  projectId: offer.resource.projectId,
                })}
              </button>
              <button
                type="button"
                aria-label={t('Dismiss')}
                onClick={() => followAlong.offer(null)}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-gray-10 transition-colors hover:bg-accent-4 hover:text-gray-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-8"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function offerLabel({
  kind,
  name,
}: {
  kind: FollowOffer['kind'];
  name: string;
}): string {
  switch (kind) {
    case 'ready':
      return t('{name} is ready', { name });
    case 'switch':
      return t('Now editing {name}', { name });
    case 'project':
      return t('{name} is in another project', { name });
  }
}

function actionLabel({
  kind,
  projectId,
}: {
  kind: FollowOffer['kind'];
  projectId: string | undefined;
}): string {
  switch (kind) {
    case 'ready':
      return t('Open beside');
    case 'switch':
      return t('Switch');
    case 'project': {
      const project = projectId ? projectCollection.get(projectId) : undefined;
      return project
        ? t('Switch to {project} and open', {
            project: getProjectName(project),
          })
        : t('Switch project and open');
    }
  }
}
