import { tryCatch } from '@activepieces/core-utils';
import {
  FlowDraftUpdatedEvent,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { useEffect } from 'react';

import { useSocket } from '@/components/providers/socket-provider';
import { flowsApi } from '@/features/flows';

import { useBuilderStore } from '../builder-hooks';

export function useLiveFlowUpdates() {
  const socket = useSocket();
  const store = useBuilderStore();

  useEffect(() => {
    let waitingForSave = false;

    const refresh = async () => {
      const { flow, saving } = store.getState();
      if (saving) {
        waitingForSave = true;
        return;
      }
      const { data } = await tryCatch(() => flowsApi.get(flow.id));
      if (data) {
        store.getState().applyRemoteFlow(data);
      }
    };

    const onFlowUpdated = (event: FlowDraftUpdatedEvent) => {
      const { flow, flowVersion } = store.getState();
      const isOwnOrStale =
        event.flowId !== flow.id || event.updated === flowVersion.updated;
      if (!isOwnOrStale) {
        refresh().catch(() => undefined);
      }
    };

    const unsubscribe = store.subscribe((state, previous) => {
      const saveFinished = previous.saving && !state.saving;
      if (waitingForSave && saveFinished) {
        waitingForSave = false;
        refresh().catch(() => undefined);
      }
    });

    socket.on(WebsocketClientEvent.FLOW_UPDATED, onFlowUpdated);
    return () => {
      socket.off(WebsocketClientEvent.FLOW_UPDATED, onFlowUpdated);
      unsubscribe();
    };
  }, [socket, store]);
}
