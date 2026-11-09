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

  useEffect(() => {
    let stopLeaving = (): void => undefined;
    const leaveIfDeleted = (change: FollowChange) => {
      if (change.op !== 'delete' || !change.navigable || embedded) return;
      if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) return;
      toast(t('The AI deleted {name}.', { name: change.resource.name }));
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
      const keys = resourceRegistry.queryKeys({
        ref: change.resource,
        op: change.op,
      });
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    });
    return () => {
      stopListening();
      stopLeaving();
    };
  }, [queryClient, navigate, embedded]);

  useEffect(() => {
    const state = useFollowAlong.getState();
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const selfNavigated = selfNavRef.current === pathname;
    if (pathChanged) selfNavRef.current = null;
    const target = state.target;
    if (!target || !state.following) return;
    const onTarget = resourceRegistry.isOn(pathname, target);
    if (pathChanged && !selfNavigated && !onTarget) {
      if (state.phase === 'editing') followAlong.stopFollowing();
      return;
    }
    if (
      onTarget ||
      state.phase !== 'editing' ||
      embedded ||
      !autoFollow ||
      !resourceRegistry.isInCurrentProject(target)
    ) {
      return;
    }

    const open = () => {
      const route = resourceRegistry.route(target);
      const push = followAlong.claimHistoryPush(runOfTarget.current);
      selfNavRef.current = route.split('?')[0];
      chatPanelUtils.openBeside({ route, push, name: target.name });
    };
    return untilPageFree((focused) => {
      const latest = useFollowAlong.getState();
      if (
        !latest.following ||
        !latest.target ||
        resourceRegistry.keyOf(latest.target) !== resourceRegistry.keyOf(target)
      ) {
        return true;
      }
      if (pageFocus.isBusyIn(focused)) return false;
      open();
      return true;
    });
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
