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
import { authenticationSession } from '@/lib/authentication-session';

import { personalizationApi } from './personalization-api';

const QUERY_KEY = ['chat-personalization'];
const RESEARCHING_REFETCH_INTERVAL_MS = 5_000;

export function usePersonalization({ enabled }: { enabled: boolean }) {
  const active = enabled;
  const socket = useSocket();
  const queryClient = useQueryClient();
  const lazyUpgradeFiredRef = useRef(false);

  const query = useQuery<ChatPersonalizationView>({
    queryKey: QUERY_KEY,
    queryFn: personalizationApi.get,
    enabled: active,
    staleTime: Infinity,
    retry: 1,
    refetchInterval: (q) =>
      isResearchingStatus(q.state.data?.status) &&
      RESEARCHING_REFETCH_INTERVAL_MS,
  });

  useEffect(() => {
    if (!active) return;
    const handler = (event: ChatPersonalizationProgressEvent) => {
      if (event.platformId !== authenticationSession.getPlatformId()) {
        return;
      }
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
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };
    socket.on(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, handler);
    socket.on('connect', reconnectHandler);
    return () => {
      socket.off(WebsocketClientEvent.CHAT_PERSONALIZATION_PROGRESS, handler);
      socket.off('connect', reconnectHandler);
    };
  }, [socket, queryClient, active]);

  const shouldLazyUpgrade =
    active &&
    query.data?.status === ChatPersonalizationStatus.READY &&
    query.data?.scope === ChatPersonalizationScope.COMPANY;
  useEffect(() => {
    if (!shouldLazyUpgrade || lazyUpgradeFiredRef.current) return;
    lazyUpgradeFiredRef.current = true;
    personalizationApi.start({ personalize: true }).catch(() => {});
  }, [shouldLazyUpgrade]);

  const status = query.data?.status ?? null;
  const personalStatus = query.data?.personalStatus ?? null;
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

  const start = ({ role, company }: { role: string; company: string }) => {
    personalizationApi
      .start({ website: company, role, personalize: true })
      .then((view) => queryClient.setQueryData(QUERY_KEY, view))
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      });
    queryClient.setQueryData(QUERY_KEY, {
      status: ChatPersonalizationStatus.PENDING,
      personalStatus: ChatPersonalizationStatus.PENDING,
      scope: ChatPersonalizationScope.COMPANY,
      useCases: [],
      profile: null,
      companyInput: company,
      roleInput: role,
      prefill: query.data?.prefill ?? null,
    });
  };

  const reset = () => {
    queryClient.setQueryData(QUERY_KEY, {
      status: ChatPersonalizationStatus.SKIPPED,
      personalStatus: ChatPersonalizationStatus.SKIPPED,
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
    personalStatus,
    isResolving: active && query.isLoading,
    useCases: active ? readyUseCases : null,
    profile: active ? query.data?.profile ?? null : null,
    companyInput,
    roleInput,
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
  personalStatus: ChatPersonalizationStatus | null;
  useCases: PersonalizationUseCase[] | null;
  isResearching: boolean;
};
