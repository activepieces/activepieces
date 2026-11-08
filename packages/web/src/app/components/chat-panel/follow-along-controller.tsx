import { tryCatch } from '@activepieces/core-utils';
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
import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import {
  chatTransitions,
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
  const lastPath = useRef(pathname);
  const seenGoRequests = useRef(goRequests);
  const selfNavRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const runOfTarget = useRef<string | null>(null);
  const pushedRuns = useRef(new Set<string>());

  const openTarget = useRef(
    ({ resource, runId }: { resource: ResourceRef; runId: string | null }) => {
      const cached = queryClient.getQueryData([
        'chat-resource-name',
        resource.kind,
        resource.id,
      ]);
      const route = resourceRegistry.route(resource);
      selfNavRef.current = route.split('?')[0];
      const push = runId === null || !pushedRuns.current.has(runId);
      if (runId !== null) pushedRuns.current.add(runId);
      followAlong.offer(null);
      chatTransitions.openBeside({
        route,
        push,
        name:
          resource.name ?? (typeof cached === 'string' ? cached : undefined),
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
      const cached = queryClient.getQueryData([
        'chat-resource-name',
        change.resource.kind,
        change.resource.id,
      ]);
      const name =
        change.resource.name ??
        (typeof cached === 'string' ? cached : null) ??
        resourceRegistry.kindInfo(change.resource.kind).label;
      toast(t('{name} was deleted by chat.', { name }));
      const leave = () => {
        if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) {
          return true;
        }
        if (isTypingInPage() || overlayIsOpen()) return false;
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
        if (change.op === 'view') followAlong.view(change.resource);
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
    if (phase === 'idle') followAlong.offer(null);
  }, [phase]);

  useEffect(() => {
    const onPage = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest('[data-chat-root]')) {
        return;
      }
      if (target.closest(`#${CARD_ID}`)) followAlong.touchPage();
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
      if (isTypingInPage() || overlayIsOpen()) {
        followAlong.offer({ resource: target, kind: 'ready', runId });
        return;
      }
      openTarget.current({ resource: target, runId: offered });
      return;
    }
    if (state.phase !== 'editing' || embedded) return;
    if (!resourceRegistry.isInCurrentProject(target)) {
      followAlong.offer({ resource: target, kind: 'project', runId });
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
        overlayIsOpen()
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
    const timer = setInterval(() => {
      const latest = useFollowAlong.getState();
      if (
        !latest.following ||
        !latest.target ||
        resourceRegistry.keyOf(latest.target) !== resourceRegistry.keyOf(target)
      ) {
        clearInterval(timer);
        return;
      }
      if (act()) clearInterval(timer);
    }, RECHECK_MS);
    return () => clearInterval(timer);
  }, [pathname, targetKey, following, phase, goRequests, embedded, fullPage]);

  useEffect(() => {
    if (!offer || offer.kind !== 'ready') return;
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
        overlayIsOpen()
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
  }, [offer]);

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
  if (!(active instanceof HTMLElement) || active === document.body) {
    return false;
  }
  if (active.closest('[data-chat-root]')) return false;
  if (active.isContentEditable) return true;
  if (active instanceof HTMLTextAreaElement) return true;
  if (active instanceof HTMLInputElement) {
    return !['checkbox', 'radio', 'button', 'submit', 'range'].includes(
      active.type,
    );
  }
  return false;
}

function overlayIsOpen(): boolean {
  return [...document.querySelectorAll(MODAL_LAYERS)].some(
    (layer) =>
      !layer.closest('[data-chat-root]') &&
      layer.getAttribute('data-state') !== 'closed' &&
      (layer.getAttribute('role') !== 'dialog' ||
        layer.getAttribute('aria-modal') === 'true' ||
        !layer.closest('[data-radix-popper-content-wrapper]')),
  );
}

function composer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-chat-root] textarea, [data-chat-root] [contenteditable="true"]',
  );
}

function composerHasDraft(): boolean {
  const input = composer();
  if (!input) return false;
  const text =
    input instanceof HTMLTextAreaElement ? input.value : input.textContent;
  return (text ?? '').trim().length > 0;
}

function composerFocused(): boolean {
  const input = composer();
  return input !== null && input === document.activeElement;
}

function chatAtBottom(): boolean {
  const scroller = document.querySelector<HTMLElement>(
    '[data-chat-root] [role="log"] > div',
  );
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
const CARD_ID = 'dashboard-content-container';
const MODAL_LAYERS = '[role="dialog"], [role="alertdialog"], [role="menu"]';
