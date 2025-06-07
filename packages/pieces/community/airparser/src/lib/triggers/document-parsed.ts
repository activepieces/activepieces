import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { inboxIdDropdown } from '../common/props';

export const documentParsedTrigger = createTrigger({
  auth: airparserAuth,
  name: 'document_parsed',
  displayName: 'Document Parsed',
  description: 'Triggers when a new document is parsed in a specific Airparser inbox.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    inboxId: inboxIdDropdown
  },
  async onEnable(context) {
    const apiKey = context.auth as string;
    const { inboxId } = context.propsValue;

    const webhook = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/inboxes/${inboxId}/webhooks`,
      {
        url: context.webhookUrl,
        event: 'document.parsed'
      }
    );

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const apiKey = context.auth as string;
    const { inboxId } = context.propsValue;
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(
        apiKey,
        HttpMethod.DELETE,
        `/inboxes/${inboxId}/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    return [context.payload.body];
  },

  async test(context) {
    const apiKey = context.auth as string;
    const { inboxId } = context.propsValue;

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/inboxes/${inboxId}/documents?limit=5&sort=-created_at`
    );

    return response.documents || [];
  },

  sampleData: {
    "id": "doc_abc123",
    "inbox_id": "inbox_xyz789",
    "created_at": "2023-11-15T10:30:00Z",
    "status": "parsed",
    "file_name": "invoice.pdf",
    "file_size": 125000,
    "mime_type": "application/pdf",
    "parsed_data": {
      "total": "$1,234.56",
      "date": "2023-11-15",
      "invoice_number": "INV-001"
    },
    "meta": {
      "external_id": "12345"
    }
  }
});