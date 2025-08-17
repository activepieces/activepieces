import { api } from '@/lib/api';
import {
  ListTriggerEventsRequest,
  SaveTriggerEventRequest,
  SeekPage,
  TestTriggerRequestBody,
  TriggerEventWithPayload,
} from '@activepieces/shared';

export const triggerEventsApi = {
  test(request: TestTriggerRequestBody) {
    return api.post<SeekPage<TriggerEventWithPayload>>(
      '/v1/test-trigger',
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
  saveTriggerMockdata(request: SaveTriggerEventRequest) {
    return api.post<TriggerEventWithPayload>(`/v1/trigger-events`, {
      flowId: request.flowId,
      mockData: request.mockData,
    });
  },
};
