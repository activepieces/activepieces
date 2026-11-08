import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { followResources } from '@/features/chat/lib/follow/follow-resources';
import { CHAT_ROUTE } from '@/lib/route-utils';

const TYPING_RECHECK_MS = 400;

// Moves the main area to whatever the chat is editing, and keeps the pages
// fresh as each tool call lands. Mounted once, above the routes.
export function FollowAlongController() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const embedded = useEmbedding().embedState.isEmbedded;
  const targetKey = useFollowAlong((s) =>
    s.target ? followResources.keyOf(s.target) : null,
  );
  const following = useFollowAlong((s) => s.following);
  const phase = useFollowAlong((s) => s.phase);
  const goRequests = useFollowAlong((s) => s.goRequests);
  const lastPath = useRef(pathname);
  const seenGoRequests = useRef(goRequests);

  // Each finished tool call: refetch what it touched, then let the open page
  // apply it in place (and flash what changed).
  useEffect(
    () =>
      followAlong.onToolDone((change) => {
        const keys = followResources.queryKeysOf(change.resource);
        void Promise.all(
          keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        )
          .catch(() => undefined)
          .then(() => followAlong.publishUpdated(change));
      }),
    [queryClient],
  );

  useEffect(() => {
    // Read fresh state: this effect may run in the same commit that stopped
    // following.
    const state = useFollowAlong.getState();
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const viewAsked = state.goRequests !== seenGoRequests.current;
    seenGoRequests.current = state.goRequests;
    const target = state.target;
    if (!target || !state.following) return;
    const onTarget = followResources.isOn(pathname, target);

    // The user went somewhere else mid-task: stop following. The tool card's
    // "View" brings them back.
    if (pathChanged && !onTarget && !viewAsked && state.phase === 'editing') {
      followAlong.stopFollowing();
      return;
    }
    if (onTarget) return;
    if (!viewAsked) {
      // Only a live run moves the page on its own, and never off the full
      // chat page or inside an embed.
      if (state.phase !== 'editing') return;
      if (embedded || pathname.includes(CHAT_ROUTE)) return;
    }

    const route = followResources.routeOf(target);
    if (viewAsked || !isTypingInPage()) {
      navigate(route);
      return;
    }
    // Never pull the page away while the user types in it: wait until they
    // leave the field.
    const timer = setInterval(() => {
      if (isTypingInPage()) return;
      clearInterval(timer);
      const latest = useFollowAlong.getState();
      if (latest.following && latest.target) {
        navigate(followResources.routeOf(latest.target));
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
