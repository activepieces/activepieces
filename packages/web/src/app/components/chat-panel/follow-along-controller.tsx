import { ApResourceKind, isNil } from '@activepieces/core-utils';
import {
  FlowDraftUpdatedEvent,
  ResourceChangeOp,
  TableUpdatedEvent,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useSocket } from '@/components/providers/socket-provider';
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
import { useAiFieldHighlights } from '@/features/chat/lib/follow/use-ai-highlight';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { authenticationSession } from '@/lib/authentication-session';

export function FollowAlongController({
  chatVisible,
}: {
  chatVisible: boolean;
}) {
  useAiFieldHighlights();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const queryClient = useQueryClient();
  const socket = useSocket();
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
  const hashRef = useRef(hash);
  hashRef.current = hash;
  const runOfTarget = useRef<string | null>(null);

  useEffect(() => {
    let owner = sessionOwner();
    return authenticationSession.subscribe(() => {
      const next = sessionOwner();
      if (next === owner) return;
      owner = next;
      followAlong.reset();
    });
  }, []);

  useEffect(() => {
    let eventCount = 0;
    let appliedEvent = 0;
    const deletedAt = new Map<string, number>();
    const follow = async ({ kind, id, op, editorSessionId }: ServerChange) => {
      const run = followAlong.runOf(editorSessionId);
      const projectId = authenticationSession.getProjectId();
      if (isNil(run) || isNil(projectId)) return;
      resourceRegistry
        .queryKeys({ ref: { kind, id }, op })
        .forEach((queryKey) =>
          queryClient.invalidateQueries({ queryKey }).catch(() => undefined),
        );
      followAlong.noteWrite({ kind, id });
      const event = ++eventCount;
      const key = resourceRegistry.keyOf({ kind, id });
      if (op === ResourceChangeOp.DELETE) {
        deletedAt.set(key, event);
        followAlong.onServerChange({
          resource: {
            kind,
            id,
            projectId,
            name: followAlong.knownName({ kind, id }) ?? '',
          },
          op,
          run,
        });
        return;
      }
      const name = await queryClient.fetchQuery({
        queryKey: ['follow-along-name', kind, id],
        queryFn: () => resourceRegistry.fetchName({ kind, id }),
        staleTime: NAME_STALE_MS,
      });
      const deletedSince = (deletedAt.get(key) ?? 0) > event;
      if (event < appliedEvent || deletedSince) return;
      appliedEvent = event;
      followAlong.onServerChange({
        resource: { kind, id, projectId, name },
        op,
        run,
      });
    };
    const onFlow = (event: FlowDraftUpdatedEvent) =>
      follow({ kind: ApResourceKind.FLOW, id: event.flowId, ...event }).catch(
        () => undefined,
      );
    const onTable = (event: TableUpdatedEvent) =>
      follow({ kind: ApResourceKind.TABLE, id: event.tableId, ...event }).catch(
        () => undefined,
      );
    socket.on(WebsocketClientEvent.FLOW_DRAFT_UPDATED, onFlow);
    socket.on(WebsocketClientEvent.TABLE_UPDATED, onTable);
    return () => {
      socket.off(WebsocketClientEvent.FLOW_DRAFT_UPDATED, onFlow);
      socket.off(WebsocketClientEvent.TABLE_UPDATED, onTable);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    const press = (event: PointerEvent) => {
      if (!chatDom.inChat(event.target)) {
        followHold.report({ pressing: true });
      }
    };
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const releaseAfterClick = () => {
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(
        () => followHold.report({ pressing: false }),
        0,
      );
    };
    window.addEventListener('pointerdown', press, true);
    window.addEventListener('pointerup', releaseAfterClick, true);
    window.addEventListener('pointercancel', releaseAfterClick, true);
    return () => {
      window.removeEventListener('pointerdown', press, true);
      window.removeEventListener('pointerup', releaseAfterClick, true);
      window.removeEventListener('pointercancel', releaseAfterClick, true);
      clearTimeout(releaseTimer);
      followHold.report({ pressing: false });
    };
  }, []);

  useEffect(() => {
    let stopLeaving = (): void => undefined;
    const leaveIfDeleted = (change: FollowChange) => {
      const deletedByThisChat =
        change.op === ResourceChangeOp.DELETE && change.navigable && !embedded;
      if (!deletedByThisChat) return;
      const isOnDeletedPage = () =>
        resourceRegistry.isOn({
          pathname: pathnameRef.current,
          ref: change.resource,
        });
      if (!isOnDeletedPage()) return;
      toast(
        change.resource.name
          ? t('The AI deleted {name}.', { name: change.resource.name })
          : t('The AI deleted this page.'),
      );
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
        const onSheet = hashRef.current === chatPanelUtils.SHEET_HASH;
        navigate(onSheet ? `${route}${chatPanelUtils.SHEET_HASH}` : route, {
          replace: true,
          ...(onSheet && { state: { [chatPanelUtils.SHEET_STATE]: false } }),
        });
        return true;
      });
    };
    const stopListening = followAlong.onToolDone((change) => {
      leaveIfDeleted(change);
      if (change.navigable && change.op !== ResourceChangeOp.DELETE) {
        runOfTarget.current = change.runId;
      }
    });
    return () => {
      stopListening();
      stopLeaving();
    };
  }, [navigate, embedded]);

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
      !chatVisible ||
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
    const conversationAtStart = useChatPanel.getState().conversationId;
    let settled = false;
    const tryOpen = (focused: Element | null): boolean => {
      const latest = useFollowAlong.getState();
      if (
        !latest.following ||
        !latest.target ||
        resourceRegistry.keyOf(latest.target) !== resourceRegistry.keyOf(target)
      ) {
        followAlong.dismissOffer();
        return true;
      }
      const offersTarget =
        latest.offer !== null &&
        resourceRegistry.keyOf(latest.offer.resource) ===
          resourceRegistry.keyOf(target);
      if (offersTarget && chatDom.inChat(focused)) return false;
      if (
        pageFocus.isBusyIn(focused) ||
        followHold.holds({ fullPage: chatPanelUtils.isFullPage() })
      ) {
        followAlong.offer({ resource: target, runId: runOfTarget.current });
        return false;
      }
      if (followHold.pagePressed()) return false;
      followAlong.dismissOffer();
      open();
      return true;
    };
    const stop = untilPageFree((focused) => (settled = tryOpen(focused)));
    return () => {
      stop();
      const latest = useFollowAlong.getState();
      if (latest.phase === 'editing') {
        followAlong.dismissOffer();
        return;
      }
      const stillPending =
        !settled &&
        latest.following &&
        latest.target !== null &&
        resourceRegistry.keyOf(latest.target) ===
          resourceRegistry.keyOf(target) &&
        useChatPanel.getState().conversationId === conversationAtStart;
      if (stillPending) {
        followAlong.offer({ resource: target, runId: runOfTarget.current });
      }
    };
  }, [
    pathname,
    targetKey,
    following,
    phase,
    embedded,
    autoFollow,
    chatVisible,
  ]);

  return null;
}

function sessionOwner(): string {
  return `${authenticationSession.getPlatformId()}:${authenticationSession.getCurrentUserId()}`;
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

const NAME_STALE_MS = 2000;

type ServerChange = {
  kind: ApResourceKind;
  id: string;
  op: ResourceChangeOp;
  editorSessionId: string | null;
};
