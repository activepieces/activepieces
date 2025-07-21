import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { pandadocAuth } from '../common';

export const documentStateChanged = createTrigger({
  name: 'documentStateChanged',
  displayName: 'Document State Changed',
  description: 'Triggers when a document status changes.',
  auth: pandadocAuth,
  props: {
    filter_status: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Status',
      description: 'Only trigger for specific status changes (leave empty for all)',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'document.draft' },
          { label: 'Sent', value: 'document.sent' },
          { label: 'Completed', value: 'document.completed' },
          { label: 'Uploaded', value: 'document.uploaded' },
          { label: 'Error', value: 'document.error' },
          { label: 'Viewed', value: 'document.viewed' },
          { label: 'Waiting Approval', value: 'document.waiting_approval' },
          { label: 'Approved', value: 'document.approved' },
          { label: 'Rejected', value: 'document.rejected' },
          { label: 'Waiting Pay', value: 'document.waiting_pay' },
          { label: 'Paid', value: 'document.paid' },
          { label: 'Voided', value: 'document.voided' },
          { label: 'Declined', value: 'document.declined' },
          { label: 'External Review', value: 'document.external_review' },
        ],
      },
    }),
  },
  sampleData: {
    event_type: 'document_state_changed',
    data: {
      id: 'sample_document_id',
      name: 'Sample Contract',
      status: 'document.sent',
      previous_status: 'document.draft',
      date_modified: '2024-01-15T10:30:00Z',
      date_sent: '2024-01-15T10:30:00Z',
      recipients: [
        {
          id: 'recipient_id',
          email: 'client@example.com',
          has_completed: false,
          role: 'Client'
        }
      ]
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookSubscription = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pandadoc.com/public/v1/webhook-subscriptions',
      headers: {
        Authorization: `API-Key ${(context.auth as string)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Activepieces Document State Changed`,
        url: context.webhookUrl,
        active: true,
        triggers: ['document_state_changed'],
        payload: ['fields', 'products', 'tokens', 'metadata', 'pricing'],
      }),
    });

    await context.store?.put('webhook_id', webhookSubscription.body.uuid);
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('webhook_id');
    if (webhookId) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://api.pandadoc.com/public/v1/webhook-subscriptions/${webhookId}`,
          headers: {
            Authorization: `API-Key ${(context.auth as string)}`,
          },
        });
      } catch (error) {
        console.log('Error cleaning up webhook:', error);
      }
    }
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (payload.event_type === 'document_state_changed') {
      const documentData = payload.data;
      const currentStatus = documentData?.status;

      if (context.propsValue.filter_status && context.propsValue.filter_status.length > 0) {
        if (!context.propsValue.filter_status.includes(currentStatus)) {
          return [];
        }
      }

      return [documentData];
    }

    return [];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.NONE,
  },
});
