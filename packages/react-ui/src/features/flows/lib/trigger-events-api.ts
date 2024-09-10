import { api } from '@/lib/api';
import {
  ListTriggerEventsRequest,
  SeekPage,
  TestPollingTriggerRequest,
  TriggerEvent,
} from '@activepieces/shared';

export const triggerEventsApi = {
  pollTrigger(request: TestPollingTriggerRequest) {
    return api.get<SeekPage<TriggerEvent>>('/v1/trigger-events/poll', request);
  },
  list(request: ListTriggerEventsRequest): Promise<SeekPage<TriggerEvent>> {
    return api.get<SeekPage<TriggerEvent>>('/v1/trigger-events', request);
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
    return api.post<TriggerEvent>(
      `/v1/trigger-events?flowId=${flowId}`,
      mockData,
    );
  },
};
