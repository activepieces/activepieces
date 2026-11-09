import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/providers/embed-provider';
import {
  FollowChange,
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { pageFocus } from '@/features/chat/lib/follow/page-focus';
import { useAiFieldHighlights } from '@/features/chat/lib/follow/use-ai-highlight';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

export function FollowAlongController() {
  useAiFieldHighlights();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const embedded = useEmbedding().embedState.isEmbedded;
  const targetKey = useFollowAlong((s) =>
    s.target ? resourceRegistry.keyOf(s.target) : null,
  );
  const following = useFollowAlong((s) => s.following);
  const phase = useFollowAlong((s) => s.phase);
  const autoFollow = useChatPanel((s) => s.autoFollow);
  const lastPath = useRef(pathname);
  const selfNavRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const runOfTarget = useRef<string | null>(null);
  const pushedRuns = useRef(new Set<string>());

  useEffect(() => {
    let stopLeaving = (): void => undefined;
    const leaveIfDeleted = (change: FollowChange) => {
      if (change.op !== 'delete' || !change.navigable || embedded) return;
      if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) return;
      toast(t('Chat deleted {name}.', { name: change.resource.name }));
      stopLeaving();
      stopLeaving = untilPageFree((focused) => {
        if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) {
          return true;
        }
        if (pageFocus.isBusyIn(focused)) return false;
        const route = resourceRegistry.parentRoute(change.resource);
        selfNavRef.current = route;
        navigate(route, { replace: true });
        return true;
      });
    };
    const stopListening = followAlong.onToolDone((change) => {
      leaveIfDeleted(change);
      if (change.navigable && change.op !== 'delete') {
        runOfTarget.current = change.runId;
      }
      const keys = resourceRegistry.queryKeys(change.resource);
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    });
    return () => {
      stopListening();
      stopLeaving();
    };
  }, [queryClient, navigate, embedded]);

  useEffect(() => {
    const target = useFollowAlong.getState().target;
    if (phase !== 'editing' || !target) return;
    useChatPanel
      .getState()
      .announce(t('Chat is changing {name}', { name: target.name }));
  }, [phase, targetKey]);

  useEffect(() => {
    const state = useFollowAlong.getState();
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const selfNavigated = selfNavRef.current === pathname;
    if (pathChanged) selfNavRef.current = null;
    if (state.offer && resourceRegistry.isOn(pathname, state.offer.resource)) {
      followAlong.dismissOffer();
    }
    const target = state.target;
    if (!target || !state.following) return;
    const onTarget = resourceRegistry.isOn(pathname, target);
    if (pathChanged && !selfNavigated && !onTarget) {
      if (state.phase === 'editing') followAlong.stopFollowing();
      return;
    }
    const decision = followAlong.decide({
      state,
      onTarget,
      autoFollow,
      embedded,
      busy: pageFocus.isAwayIn(document.activeElement),
    });
    if (decision === 'offer') {
      followAlong.offer(target);
      return;
    }
    if (decision === 'stay') return;
    followAlong.dismissOffer();
    const route = resourceRegistry.route(target);
    const runId = runOfTarget.current;
    const push = runId === null || !pushedRuns.current.has(runId);
    if (runId !== null) pushedRuns.current.add(runId);
    selfNavRef.current = route.split('?')[0];
    chatPanelUtils.openBeside({ route, push, name: target.name });
  }, [pathname, targetKey, following, phase, embedded, autoFollow]);

  return null;
}

function untilPageFree(run: (focused: Element | null) => boolean): () => void {
  if (run(document.activeElement)) return () => undefined;
  const onFocusIn = (event: FocusEvent) => retry(eventElement(event.target));
  const onFocusOut = (event: FocusEvent) =>
    retry(eventElement(event.relatedTarget));
  const stop = () => {
    window.removeEventListener('focusin', onFocusIn, true);
    window.removeEventListener('focusout', onFocusOut, true);
  };
  const retry = (focused: Element | null) => {
    if (run(focused)) stop();
  };
  window.addEventListener('focusin', onFocusIn, true);
  window.addEventListener('focusout', onFocusOut, true);
  return stop;
}

function eventElement(target: EventTarget | null): Element | null {
  return target instanceof Element ? target : null;
}
