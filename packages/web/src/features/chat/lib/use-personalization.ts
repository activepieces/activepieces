import {
  ApEdition,
  ApFlagId,
  ChatPersonalizationProgressEvent,
  ChatPersonalizationScope,
  ChatPersonalizationStatus,
  ChatPersonalizationView,
  PersonalizationUseCase,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';

import { personalizationApi } from './personalization-api';

const QUERY_KEY = ['chat-personalization'];
const RESEARCHING_REFETCH_INTERVAL_MS = 5_000;

export function usePersonalization({ enabled }: { enabled: boolean }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const active = isCloud && enabled;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [feed, setFeed] = useState<{ phase: string; message: string } | null>(
    null,
  );
  const lazyUpgradeFiredRef = useRef(false);

  // No meta.showErrorDialog on purpose: a failing personalization fetch must
  // silently fall back to the default example cards.
  const query = useQuery<ChatPersonalizationView>({
    queryKey: QUERY_KEY,
    queryFn: personalizationApi.get,
    enabled: active,
    staleTime: Infinity,
    retry: 1,
    // Safety net for missed socket events (tab asleep, reconnect races) and
    // second-device resume while research is running.
    refetchInterval: (q) =>
      isResearchingStatus(q.state.data?.status) &&
      RESEARCHING_REFETCH_INTERVAL_MS,
  });

  useEffect(() => {
    if (!active) return;
    const handler = (event: ChatPersonalizationProgressEvent) => {
      if (!event.done) {
        setFeed({ phase: event.phase, message: event.message });
        return;
      }
      setFeed(null);
      if (event.result) {
        queryClient.setQueryData(QUERY_KEY, event.result);
      } else {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    };
    const reconnectHandler = () => {
      socket.off(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, handler);
      socket.on(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, handler);
      // The final event may have fired while disconnected.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };
    socket.on(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, handler);
    socket.on('connect', reconnectHandler);
    return () => {
      socket.off(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, handler);
      socket.off('connect', reconnectHandler);
    };
  }, [socket, queryClient, active]);

  // Lazy per-person upgrade: an invited teammate lands on a READY company-level
  // result — kick off their own role-targeted research once, in the background.
  const shouldLazyUpgrade =
    active &&
    query.data?.status === ChatPersonalizationStatus.READY &&
    query.data?.scope === ChatPersonalizationScope.COMPANY;
  useEffect(() => {
    if (!shouldLazyUpgrade || lazyUpgradeFiredRef.current) return;
    lazyUpgradeFiredRef.current = true;
    personalizationApi.start({ personalize: true }).catch(() => {
      // Best-effort: company cards remain a perfectly good experience.
    });
  }, [shouldLazyUpgrade]);

  const status = query.data?.status ?? null;
  const isResearching = active && isResearchingStatus(status ?? undefined);
  const readyUseCases =
    status === ChatPersonalizationStatus.READY &&
    query.data?.useCases &&
    query.data.useCases.length > 0
      ? query.data.useCases
      : null;
  const feedMessage = isResearching
    ? feed?.message ?? defaultFeedMessage(query.data)
    : null;

  // Re-run with edited inputs (the chip's Edit action) — the view flips to
  // PENDING so the journey plays again immediately.
  const rerun = ({ website, role }: { website: string; role: string }) => {
    setFeed(null);
    personalizationApi
      .start({ website, role, personalize: true })
      .then((view) => queryClient.setQueryData(QUERY_KEY, view))
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      });
    queryClient.setQueryData(
      QUERY_KEY,
      (previous: ChatPersonalizationView | undefined) =>
        previous
          ? { ...previous, status: ChatPersonalizationStatus.PENDING }
          : previous,
    );
  };

  // Back to the stock cards. The server keeps the researched data on the
  // SKIPPED rows, so personalizeAgain() restores instantly.
  const reset = () => {
    setFeed(null);
    queryClient.setQueryData(
      QUERY_KEY,
      (previous: ChatPersonalizationView | undefined) =>
        previous
          ? { ...previous, status: ChatPersonalizationStatus.SKIPPED }
          : previous,
    );
    personalizationApi.start({ personalize: false }).catch(() => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    });
  };

  // Re-personalize after a reset: the server flips the stored rows back to
  // READY (instant, no research) or re-runs when nothing is stored.
  const personalizeAgain = () => {
    setFeed(null);
    personalizationApi
      .start({ personalize: true })
      .then((view) => queryClient.setQueryData(QUERY_KEY, view))
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      });
  };

  return {
    status,
    useCases: active ? readyUseCases : null,
    profile: active ? query.data?.profile ?? null : null,
    isResearching,
    feedMessage,
    phase: isResearching ? feed?.phase ?? null : null,
    rerun,
    reset,
    personalizeAgain,
  };
}

function isResearchingStatus(status: ChatPersonalizationStatus | undefined) {
  return (
    status === ChatPersonalizationStatus.PENDING ||
    status === ChatPersonalizationStatus.RESEARCHING
  );
}

function defaultFeedMessage(view: ChatPersonalizationView | undefined): string {
  const company = view?.profile?.companyName;
  return company
    ? t('Researching {company}…', { company })
    : t('Personalizing your workspace…');
}

export type PersonalizationState = {
  status: ChatPersonalizationStatus | null;
  useCases: PersonalizationUseCase[] | null;
  isResearching: boolean;
  feedMessage: string | null;
};
