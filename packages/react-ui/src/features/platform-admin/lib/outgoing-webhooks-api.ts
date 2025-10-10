import { api } from '@/lib/api';
import {
  CreateOutgoingWebhookRequestBody,
  OutgoingWebhook,
  TestOutgoingWebhookRequestBody,
  UpdateOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const outgoingWebhooksApi = {
  list() {
    return api.get<SeekPage<OutgoingWebhook>>('/v1/outgoing-webhooks');
  },
  create(request: CreateOutgoingWebhookRequestBody) {
    return api.post<OutgoingWebhook>('/v1/outgoing-webhooks', request);
  },
  update(id: string, request: UpdateOutgoingWebhookRequestBody) {
    return api.patch<OutgoingWebhook>(`/v1/outgoing-webhooks/${id}`, request);
  },
  delete(id: string) {
    return api.delete<void>(`/v1/outgoing-webhooks/${id}`);
  },
  test(request: TestOutgoingWebhookRequestBody) {
    return api.post<void>(`/v1/outgoing-webhooks/test`, request);
  },
};
