import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { cognitoFormsAuth } from '../../index';
import { formIdDropdown } from '../common/props';

export interface StoredWebhookData {
  webhookId: string;
}

export interface WebhookCreationResponse {
  id: string;
  [key: string]: any;
}

export const newEntrySubmittedTrigger = createTrigger({
  name: 'new_entry_submitted',
  displayName: 'New Entry Submitted',
  description: 'Triggers when a new form entry is submitted',
  auth: cognitoFormsAuth,
  props: {
    formId: formIdDropdown,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    Id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    FormId: '7p8o9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
    Number: 123,
    Status: 'Submitted',
    DateCreated: '2023-06-15T10:30:45Z',
    DateSubmitted: '2023-06-15T10:35:22Z',
    DateUpdated: '2023-06-15T10:35:22Z',
    Entry: {
      Name: 'John Doe',
      Email: 'john.doe@example.com',
      Phone: '555-123-4567',
      Message: 'This is a sample form submission',
    },
  },

  async onEnable(context) {
    try {
      const formId = context.propsValue.formId;

      const response = await makeRequest(
        context.auth as string,
        HttpMethod.POST,
        '/webhooks',
        {
          url: context.webhookUrl,
          events: ['EntrySubmitted'],
          formId: formId,
        }
      ) as WebhookCreationResponse;

      if (!response?.id) {
        throw new Error('Failed to create webhook: Invalid response format');
      }

      await context.store.put<StoredWebhookData>('webhookData', {
        webhookId: response.id,
      });
    } catch (error) {
      throw new Error(`Failed to enable new entry submitted trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async onDisable(context) {
    try {
      const webhookData = await context.store.get<StoredWebhookData>('webhookData');
      if (webhookData?.webhookId) {
        await makeRequest(
          context.auth as string,
          HttpMethod.DELETE,
          `/webhooks/${webhookData.webhookId}`
        );
      }
    } catch (error) {
      throw new Error(`Failed to disable new entry submitted trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async run(context) {
    return context.payload.body ? [context.payload.body] : [];
  },
});
