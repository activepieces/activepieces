import { api } from '@/lib/api';
import {
  ListTriggerEventsRequest,
  SeekPage,
  TestPollingTriggerRequest,
  TriggerEventWithPayload,
  WebhookSimulation,
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
  async getWebhookSimulation(flowId: string) {
    try {
      return await api.get<WebhookSimulation>(`/v1/webhook-simulation/`, {
        flowId,
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  saveTriggerMockdata(flowId: string, mockData: unknown) {
    return api.post<TriggerEventWithPayload>(
      `/v1/trigger-events?flowId=${flowId}`,
      mockData,
    );
  },
};
