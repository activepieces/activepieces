import { tryCatch } from '@activepieces/core-utils';
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
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { resourceNames } from '@/features/chat/lib/resources/resource-names';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

import { useShellHandle } from '../app-shell';

export function FollowAlongController() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fullPage = useShellHandle().chat === 'full';
  const queryClient = useQueryClient();
  const embedded = useEmbedding().embedState.isEmbedded;
  const targetKey = useFollowAlong((s) =>
    s.target ? resourceRegistry.keyOf(s.target) : null,
  );
  const following = useFollowAlong((s) => s.following);
  const phase = useFollowAlong((s) => s.phase);
  const goRequests = useFollowAlong((s) => s.goRequests);
  const offer = useFollowAlong((s) => s.offer);
  const conversationId = useChatPanel((s) => s.conversationId);
  const autoFollow = useChatPanel((s) => s.autoFollow);
  const lastPath = useRef(pathname);
  const seenGoRequests = useRef(goRequests);
  const selfNavRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const runOfTarget = useRef<string | null>(null);
  const pushedRuns = useRef(new Set<string>());
  const waitingFor = useRef<string | null>(null);

  const openTarget = useRef(
    ({ resource, runId }: { resource: ResourceRef; runId: string | null }) => {
      const route = resourceRegistry.route(resource);
      selfNavRef.current = route.split('?')[0];
      const push = runId === null || !pushedRuns.current.has(runId);
      if (runId !== null) pushedRuns.current.add(runId);
      followAlong.offer(null);
      chatPanelUtils.openBeside({
        route,
        push,
        name: resourceNames.known({ queryClient, ref: resource }) ?? undefined,
      });
    },
  );

  useEffect(() => {
    const goTo = ({ route, replace }: { route: string; replace: boolean }) => {
      selfNavRef.current = route.split('?')[0];
      navigate(route, { replace });
    };
    const leaveIfDeleted = (change: FollowChange) => {
      if (change.op !== 'delete' || !change.navigable || embedded) return;
      if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) return;
      const name =
        resourceNames.known({ queryClient, ref: change.resource }) ??
        resourceRegistry.kindInfo(change.resource.kind).label;
      toast(t('{name} was deleted by chat.', { name }));
      const leave = () => {
        if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) {
          return true;
        }
        if (isTypingInPage() || chatDom.modalLayerOpen()) return false;
        goTo({
          route: resourceRegistry.parentRoute(change.resource),
          replace: true,
        });
        return true;
      };
      if (leave()) return;
      const timer = setInterval(() => {
        if (leave()) clearInterval(timer);
      }, RECHECK_MS);
    };
    return followAlong.onToolDone((change) => {
      leaveIfDeleted(change);
      if (
        change.navigable &&
        change.op !== 'delete' &&
        resourceRegistry.autoOpens(change.resource.kind)
      ) {
        runOfTarget.current = change.runId;
        if (change.op === 'view') {
          if (useChatPanel.getState().autoFollow) {
            followAlong.view(change.resource);
          } else if (
            !resourceRegistry.isOn(pathnameRef.current, change.resource)
          ) {
            followAlong.offer({
              resource: change.resource,
              kind: resourceRegistry.isInCurrentProject(change.resource)
                ? 'ready'
                : 'project',
              runId: change.runId,
            });
          }
        }
      }
      const keys = resourceRegistry.queryKeys(change.resource);
      tryCatch(() =>
        Promise.all(
          keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        ),
      )
        .then(() => afterSettle(() => followAlong.publishUpdated(change)))
        .catch(() => undefined);
    });
  }, [queryClient, navigate, embedded]);

  useEffect(() => {
    followAlong.offer(null);
  }, [conversationId]);

  useEffect(() => {
    if (
      phase === 'idle' &&
      useChatPanel.getState().autoFollow &&
      useFollowAlong.getState().offer?.kind !== 'ready'
    ) {
      followAlong.offer(null);
    }
  }, [phase]);

  useEffect(() => {
    const onPage = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        !chatDom.inChat(target) &&
        target.closest(`#${chatLayoutUtils.CARD_ID}`)
      ) {
        followAlong.touchPage();
      }
    };
    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'wheel',
      'keydown',
      'focusin',
    ];
    events.forEach((name) =>
      window.addEventListener(name, onPage, { capture: true, passive: true }),
    );
    return () => {
      events.forEach((name) =>
        window.removeEventListener(name, onPage, { capture: true }),
      );
    };
  }, []);

  useEffect(() => {
    const state = useFollowAlong.getState();
    const waited = waitingFor.current;
    waitingFor.current = null;
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const selfNavigated = selfNavRef.current === pathname;
    if (pathChanged) selfNavRef.current = null;
    const viewAsked = state.goRequests !== seenGoRequests.current;
    seenGoRequests.current = state.goRequests;
    const userNavigated = pathChanged && !selfNavigated && !viewAsked;
    if (userNavigated) followAlong.offer(null);
    const target = state.target;
    if (!target || !state.following) return;
    const onTarget = resourceRegistry.isOn(pathname, target);

    if (userNavigated && !onTarget && state.phase === 'editing') {
      followAlong.stopFollowing();
      return;
    }
    if (onTarget) {
      if (
        state.offer &&
        resourceRegistry.keyOf(state.offer.resource) ===
          resourceRegistry.keyOf(target)
      ) {
        followAlong.offer(null);
      }
      return;
    }
    const runId = runOfTarget.current;
    if (viewAsked) {
      const offered =
        state.offer &&
        resourceRegistry.keyOf(state.offer.resource) ===
          resourceRegistry.keyOf(target)
          ? state.offer.runId
          : null;
      if (!resourceRegistry.isInCurrentProject(target)) {
        followAlong.offer({ resource: target, kind: 'project', runId });
        return;
      }
      if (isTypingInPage() || chatDom.modalLayerOpen()) {
        followAlong.offer({ resource: target, kind: 'ready', runId });
        return;
      }
      openTarget.current({ resource: target, runId: offered });
      return;
    }
    if (state.phase !== 'editing' || embedded) {
      if (!embedded && waited === resourceRegistry.keyOf(target)) {
        followAlong.offer({ resource: target, kind: 'ready', runId });
      }
      return;
    }
    if (!resourceRegistry.isInCurrentProject(target)) {
      followAlong.offer({ resource: target, kind: 'project', runId });
      return;
    }
    if (!autoFollow) {
      followAlong.offer({ resource: target, kind: 'ready', runId });
      return;
    }
    if (!fullPage && state.pageTouched) {
      followAlong.offer({ resource: target, kind: 'switch', runId });
      return;
    }

    const decide = (): 'wait' | 'offer' | 'open' => {
      if (
        useChatPanel.getState().gateOpen ||
        isTypingInPage() ||
        chatDom.modalLayerOpen()
      ) {
        return 'wait';
      }
      if (fullPage && (composerHasDraft() || !chatAtBottom())) return 'offer';
      return 'open';
    };
    const act = (): boolean => {
      const decision = decide();
      if (decision === 'wait') return false;
      if (decision === 'offer') {
        followAlong.offer({ resource: target, kind: 'ready', runId });
      } else {
        openTarget.current({ resource: target, runId });
      }
      return true;
    };
    if (act()) return;
    waitingFor.current = resourceRegistry.keyOf(target);
    const timer = setInterval(() => {
      const latest = useFollowAlong.getState();
      if (
        !latest.following ||
        !latest.target ||
        resourceRegistry.keyOf(latest.target) !== resourceRegistry.keyOf(target)
      ) {
        waitingFor.current = null;
        clearInterval(timer);
        return;
      }
      if (act()) {
        waitingFor.current = null;
        clearInterval(timer);
      }
    }, RECHECK_MS);
    return () => clearInterval(timer);
  }, [
    pathname,
    targetKey,
    following,
    phase,
    goRequests,
    embedded,
    fullPage,
    autoFollow,
  ]);

  useEffect(() => {
    if (!offer || offer.kind !== 'ready' || !autoFollow) return;
    let lastInput = Date.now();
    const onInput = () => {
      lastInput = Date.now();
    };
    const events: (keyof WindowEventMap)[] = [
      'keydown',
      'pointerdown',
      'wheel',
      'input',
    ];
    events.forEach((name) =>
      window.addEventListener(name, onInput, { capture: true, passive: true }),
    );
    const timer = setInterval(() => {
      const latest = useFollowAlong.getState();
      if (
        latest.offer !== offer ||
        !latest.following ||
        latest.phase === 'idle'
      ) {
        clearInterval(timer);
        return;
      }
      if (
        Date.now() - lastInput < IDLE_MS ||
        !chatAtBottom() ||
        (composerHasDraft() && composerFocused()) ||
        useChatPanel.getState().gateOpen ||
        chatDom.modalLayerOpen()
      ) {
        return;
      }
      clearInterval(timer);
      openTarget.current({ resource: offer.resource, runId: offer.runId });
    }, RECHECK_MS);
    return () => {
      clearInterval(timer);
      events.forEach((name) =>
        window.removeEventListener(name, onInput, { capture: true }),
      );
    };
  }, [offer, autoFollow]);

  return null;
}

function afterSettle(run: () => void) {
  if (!useChatPanel.getState().moving) {
    run();
    return;
  }
  const unsubscribe = useChatPanel.subscribe((state) => {
    if (state.moving) return;
    unsubscribe();
    setTimeout(run, GLOW_AFTER_SETTLE_MS);
  });
}

function isTypingInPage(): boolean {
  const active = document.activeElement;
  return chatDom.isTypingIn(active) && !chatDom.inChat(active);
}

function composerHasDraft(): boolean {
  const input = chatDom.composer();
  if (!input) return false;
  const text =
    input instanceof HTMLTextAreaElement ? input.value : input.textContent;
  return (text ?? '').trim().length > 0;
}

function composerFocused(): boolean {
  const input = chatDom.composer();
  return input !== null && input === document.activeElement;
}

function chatAtBottom(): boolean {
  const scroller = chatDom.scroller();
  if (!scroller) return true;
  return (
    scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <=
    AT_BOTTOM_GAP
  );
}

const RECHECK_MS = 250;
const IDLE_MS = 1500;
const GLOW_AFTER_SETTLE_MS = 120;
const AT_BOTTOM_GAP = 24;
