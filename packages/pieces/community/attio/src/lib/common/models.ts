export interface WebhookCreationResponse {
  target_url: string;
  subscriptions: Array<{
    event_type: string;
    filter?: any;
  }>;
  id: {
    workspace_id: string;
    webhook_id: string;
  };
  status: string;
  created_at: string;
  secret: string;
}

export interface StoredWebhookData {
  webhookId: string;
}

export interface IncomingWebhookPayload {
  webhook_id: string;
  events: Array<{
    event_type: string;
    id: {
      workspace_id: string;
      object_id?: string;
      record_id?: string;
      list_id?: string;
      entry_id?: string;
      attribute_id?: string;
    };
    parent_object_id?: string;
    parent_record_id?: string;
    actor?: {
      type: string;
      id: string;
    };
  }>;
}
