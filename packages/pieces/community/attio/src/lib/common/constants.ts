export const BASE_URL = 'https://api.attio.com/v2';

export const API_ENDPOINTS = {
  CREATE_WEBHOOK: '/webhooks',
  DELETE_WEBHOOK: '/webhooks',
};

export type attioWebhookEventType =
  | 'list-entry.created'
  | 'list-entry.updated'
  | 'record.created'
  | 'record.updated';

export type attioStoredWebhookId = {
  webhookId: string
}

export interface attioWebhookResponse {
  target_url: string;
  subscriptions: Array<{
    event_type: string;
  }>;
  id: {
    workspace_id: string;
    webhook_id: string;
  };
  status: string;
  created_at: string;
  secret: string;
}