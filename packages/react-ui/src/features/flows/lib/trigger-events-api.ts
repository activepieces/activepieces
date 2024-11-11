import { api } from '@/lib/api';
import {
  ListTriggerEventsRequest,
  SeekPage,
  TestPollingTriggerRequest,
  TriggerEventWithPayload,
} from '@activepieces/shared';

export const triggerEventsApi = {
  pollTrigger(request: TestPollingTriggerRequest) {
    return api.get<SeekPage<TriggerEventWithPayload>>(
      '/v1/trigger-events/poll',
      request,
    );
  },
  list(
    request: ListTriggerEventsRequest,
  ): Promise<SeekPage<TriggerEventWithPayload>> {
    return api.get<SeekPage<TriggerEventWithPayload>>(
      '/v1/trigger-events',
      request,
    );
  },
  startWebhookSimulation(flowId: string) {
    return api.post<void>('/v1/webhook-simulation', {
      flowId,
    });
  },
  deleteWebhookSimulation(flowId: string) {
    return api.delete<void>('/v1/webhook-simulation', {
      flowId,
    });
  },
  saveTriggerMockdata(flowId: string, mockData: unknown) {
    return api.post<TriggerEventWithPayload>(
      `/v1/trigger-events?flowId=${flowId}`,
      mockData,
    );
  },
};
