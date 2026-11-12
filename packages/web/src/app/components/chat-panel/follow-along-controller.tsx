import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/providers/embed-provider';
import { chatDom } from '@/features/chat/lib/chat-dom';
import {
  FollowChange,
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import {
  followHold,
  useFollowHold,
} from '@/features/chat/lib/follow/follow-hold';
import { pageFocus } from '@/features/chat/lib/follow/page-focus';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { authenticationSession } from '@/lib/authentication-session';

export function FollowAlongController() {
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

  useEffect(() => authenticationSession.subscribe(followAlong.reset), []);

  useEffect(() => {
    const press = (event: PointerEvent) => {
      if (!chatDom.inChat(event.target)) {
        followHold.report({ pressing: true });
      }
    };
    const release = () => followHold.report({ pressing: false });
    window.addEventListener('pointerdown', press, true);
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', release, true);
    return () => {
      window.removeEventListener('pointerdown', press, true);
      window.removeEventListener('pointerup', release, true);
      window.removeEventListener('pointercancel', release, true);
      release();
    };
  }, []);

  useEffect(() => {
    let stopLeaving = (): void => undefined;
    const leaveIfDeleted = (change: FollowChange) => {
      if (change.op !== 'delete' || !change.navigable || embedded) return;
      const isOnDeletedPage = () =>
        resourceRegistry.isOn({
          pathname: pathnameRef.current,
          ref: change.resource,
        });
      if (!isOnDeletedPage()) return;
      toast(t('The AI deleted {name}.', { name: change.resource.name }));
      stopLeaving();
      stopLeaving = untilPageFree((focused) => {
        if (!isOnDeletedPage()) {
          return true;
        }
        if (pageFocus.isBusyIn(focused) || followHold.pagePressed()) {
          return false;
        }
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
      keys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }).catch(() => undefined),
      );
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
    const onTarget = resourceRegistry.isOn({ pathname, ref: target });
    if (onTarget) followAlong.dismissOffer();
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
    const stop = untilPageFree((focused) => {
      const latest = useFollowAlong.getState();
      if (
        !latest.following ||
        !latest.target ||
        resourceRegistry.keyOf(latest.target) !== resourceRegistry.keyOf(target)
      ) {
        followAlong.dismissOffer();
        return true;
      }
      if (latest.offer !== null && chatDom.inChat(focused)) return false;
      if (
        pageFocus.isBusyIn(focused) ||
        followHold.holds({ fullPage: chatPanelUtils.isFullPage() })
      ) {
        followAlong.offer(target);
        return false;
      }
      if (followHold.pagePressed()) return false;
      followAlong.dismissOffer();
      open();
      return true;
    });
    return () => {
      stop();
      if (useFollowAlong.getState().phase === 'editing') {
        followAlong.dismissOffer();
      }
    };
  }, [pathname, targetKey, following, phase, embedded, autoFollow]);

  return null;
}

function untilPageFree(run: (focused: Element | null) => boolean): () => void {
  if (run(document.activeElement)) return () => undefined;
  const onFocusIn = (event: FocusEvent) => retry(eventElement(event.target));
  const onFocusOut = (event: FocusEvent) =>
    retry(eventElement(event.relatedTarget));
  const stopHold = useFollowHold.subscribe(() => retry(document.activeElement));
  const stopGate = useChatPanel.subscribe((state, previous) => {
    if (state.gateOpen !== previous.gateOpen) retry(document.activeElement);
  });
  const stop = () => {
    window.removeEventListener('focusin', onFocusIn, true);
    window.removeEventListener('focusout', onFocusOut, true);
    stopHold();
    stopGate();
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
