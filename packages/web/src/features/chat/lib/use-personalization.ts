import {
  ChatPersonalizationProgressEvent,
  ChatPersonalizationScope,
  ChatPersonalizationStatus,
  ChatPersonalizationView,
  PersonalizationUseCase,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useSocket } from '@/components/providers/socket-provider';

import { personalizationApi } from './personalization-api';

const QUERY_KEY = ['chat-personalization'];
const RESEARCHING_REFETCH_INTERVAL_MS = 5_000;

export function usePersonalization({ enabled }: { enabled: boolean }) {
  const active = enabled;
  const socket = useSocket();
  const queryClient = useQueryClient();
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

  // Research is fully background now — only the final `done` event matters
  // (it swaps the cards in the moment they're ready); progress heartbeats
  // are ignored.
  useEffect(() => {
    if (!active) return;
    const handler = (event: ChatPersonalizationProgressEvent) => {
      // Enrichment landed mid-run: fill the onboarding blanks now rather than
      // making the user wait out the rest of the research to see them.
      if (event.prefill) {
        const { prefill } = event;
        queryClient.setQueryData<ChatPersonalizationView>(QUERY_KEY, (prev) =>
          prev ? { ...prev, prefill } : prev,
        );
      }
      if (!event.done) {
        return;
      }
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
  const companyInput = active ? query.data?.companyInput ?? null : null;
  const roleInput = active ? query.data?.roleInput ?? null : null;
  const prefill = active ? query.data?.prefill ?? null : null;
  const isResearching = active && isResearchingStatus(status ?? undefined);
  const readyUseCases =
    status === ChatPersonalizationStatus.READY &&
    query.data?.useCases &&
    query.data.useCases.length > 0
      ? query.data.useCases
      : null;

  // Kick off (or re-run) research from the onboarding question card. Flips to
  // PENDING optimistically so the card never reappears mid-flight; everything
  // else about the run is invisible.
  const start = ({ role, company }: { role: string; company: string }) => {
    personalizationApi
      .start({ website: company, role, personalize: true })
      .then((view) => queryClient.setQueryData(QUERY_KEY, view))
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      });
    queryClient.setQueryData(QUERY_KEY, {
      status: ChatPersonalizationStatus.PENDING,
      scope: ChatPersonalizationScope.COMPANY,
      useCases: [],
      profile: null,
      companyInput: company,
      roleInput: role,
      prefill: query.data?.prefill ?? null,
    });
  };

  // Back to the stock cards. Skip/Clear wipes everything the user entered —
  // the server clears inputs AND researched data on the rows, so the
  // optimistic view matches: a reopened prompt starts from blank fills.
  const reset = () => {
    queryClient.setQueryData(QUERY_KEY, {
      status: ChatPersonalizationStatus.SKIPPED,
      scope: ChatPersonalizationScope.COMPANY,
      useCases: [],
      profile: null,
      companyInput: null,
      roleInput: null,
      prefill: null,
    });
    personalizationApi.start({ personalize: false }).catch(() => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    });
  };

  return {
    status,
    // True only during the very first cloud fetch (no cached view yet). The
    // empty state shows skeletons rather than the stock cards while this is
    // resolving, so an undecided returning user never flashes default cards
    // before their onboarding card appears.
    isResolving: active && query.isLoading,
    useCases: active ? readyUseCases : null,
    profile: active ? query.data?.profile ?? null : null,
    // The verbatim company blank the user typed — prefills the edit prompt so
    // researched output (profile.website) never leaks back into the input.
    companyInput,
    // The role blank as the user typed it — prefills the edit prompt even
    // while research is pending (profile only exists once READY).
    roleInput,
    // Enrichment's guess at the step-1 blanks, from the work-email domain alone.
    // Strictly a fallback behind companyInput/roleInput — those are what the
    // user actually typed.
    prefill,
    isResearching,
    start,
    reset,
  };
}

function isResearchingStatus(status: ChatPersonalizationStatus | undefined) {
  return (
    status === ChatPersonalizationStatus.PENDING ||
    status === ChatPersonalizationStatus.RESEARCHING
  );
}

export type PersonalizationState = {
  status: ChatPersonalizationStatus | null;
  useCases: PersonalizationUseCase[] | null;
  isResearching: boolean;
};
