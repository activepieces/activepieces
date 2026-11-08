import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import {
  FollowChange,
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { CHAT_ROUTE } from '@/lib/route-utils';

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
  const goRequests = useFollowAlong((s) => s.goRequests);
  const lastPath = useRef(pathname);
  const seenGoRequests = useRef(goRequests);
  const selfNavRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const goTo = ({ route, replace }: { route: string; replace: boolean }) => {
      selfNavRef.current = route.split('?')[0];
      navigate(route, { replace });
    };
    const leaveIfDeleted = (change: FollowChange) => {
      if (change.op !== 'delete' || !change.navigable || embedded) return;
      if (!resourceRegistry.isOn(pathnameRef.current, change.resource)) return;
      goTo({
        route: resourceRegistry.parentRoute(change.resource),
        replace: true,
      });
    };
    return followAlong.onToolDone((change) => {
      leaveIfDeleted(change);
      const keys = resourceRegistry.queryKeys(change.resource);
      Promise.all(
        keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
        .catch(() => undefined)
        .then(() => followAlong.publishUpdated(change))
        .catch(() => undefined);
    });
  }, [queryClient, navigate, embedded]);

  useEffect(() => {
    const state = useFollowAlong.getState();
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const selfNavigated = selfNavRef.current === pathname;
    if (pathChanged) selfNavRef.current = null;
    const viewAsked = state.goRequests !== seenGoRequests.current;
    seenGoRequests.current = state.goRequests;
    const target = state.target;
    if (!target || !state.following) return;
    const onTarget = resourceRegistry.isOn(pathname, target);

    if (
      pathChanged &&
      !selfNavigated &&
      !onTarget &&
      !viewAsked &&
      state.phase === 'editing'
    ) {
      followAlong.stopFollowing();
      return;
    }
    if (onTarget) return;
    if (!viewAsked) {
      if (state.phase !== 'editing') return;
      if (embedded || pathname.includes(CHAT_ROUTE)) return;
      if (!resourceRegistry.isInCurrentProject(target)) return;
    }

    const goToTarget = () => {
      const route = resourceRegistry.route(target);
      selfNavRef.current = route;
      navigate(route);
    };
    if (viewAsked || !isTypingInPage()) {
      goToTarget();
      return;
    }
    const timer = setInterval(() => {
      if (isTypingInPage()) return;
      clearInterval(timer);
      const latest = useFollowAlong.getState();
      if (
        latest.following &&
        latest.target &&
        resourceRegistry.keyOf(latest.target) === resourceRegistry.keyOf(target)
      ) {
        goToTarget();
      }
    }, TYPING_RECHECK_MS);
    return () => clearInterval(timer);
  }, [pathname, targetKey, following, phase, goRequests, embedded, navigate]);

  return null;
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

const TYPING_RECHECK_MS = 400;
