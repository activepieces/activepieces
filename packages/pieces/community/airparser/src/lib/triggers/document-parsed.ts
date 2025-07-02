import { HttpMethod } from '@activepieces/pieces-common';
import {
	createTrigger,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { airparserAuth } from '../../index';
import { airparserApiCall, GetDocumentResponse } from '../common';
import { inboxIdDropdown } from '../common/props';

export const documentParsedTrigger = createTrigger({
  auth: airparserAuth,
  name: 'document_parsed',
  displayName: 'Document Parsed',
  description: 'Triggers when a new document is parsed in a specific inbox.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    inboxId: inboxIdDropdown,
    markdown: Property.MarkDown({
      value: `## Airparser Webhook Setup
			To use this trigger, you need to manually set up a webhook in your Airparser account:

			1. Login to your Airparser account.
			2. Navigate to **Integrations** > **Webhooks** in the left sidebar.
			3. Enter the following URL in the webhooks field and select **Document Parsed** as webhook trigger:
			\`\`\`text
			{{webhookUrl}}
			\`\`\`
			4. Click Save to register the webhook.
			`,
    }),
  },
  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
  },
  async onDisable(context) {
    // No need to unregister webhooks as user will do it manually
  },
  async run(context) {
    const payload = context.payload.body as {
      inbox_id: string;
      doc_id: string;
      event: string;
    };

    if (
      payload.event === 'doc.parsed' &&
      payload.inbox_id === context.propsValue.inboxId
    ) {
      return [payload];
    }
    return [];
  },

  async test(context) {
    const { inboxId } = context.propsValue;
    const listDocResponse = await airparserApiCall<{
      hasPrevPage: boolean;
      hasNextPage: boolean;
      docs: { _id: string; name: string }[];
    }>({
      apiKey: context.auth as string,
      method: HttpMethod.GET,
      resourceUri: `/inboxes/${inboxId}/docs`,
      query: {
        statuses: 'parsed',
      },
    });

    if (isNil(listDocResponse.docs)) return [];

    const items = [];
    for (const doc of listDocResponse.docs) {
      const response = await airparserApiCall<GetDocumentResponse>({
        apiKey: context.auth,
        method: HttpMethod.GET,
        resourceUri: `/docs/${doc._id}/extended`,
      });

      items.push({
        inbox_id: inboxId,
        doc_id: doc._id,
        event: 'doc.parsed',
        payload: {
          filename: response.filename,
          parsed: response.json,
        },
      });
    }

    return items;
  },

  sampleData: {
    inbox_id: '6846e11bb1abe002cb1ada14',
    doc_id: '6846ee9db1abe002cb1b05ad',
    event: 'doc.parsed',
    payload: {
      filename: 'sample.pdf',
      parsed: {
        billing_address: 'Your Company Name\nYour Address City, State Zip',
        shipping_address: 'Client Name Address City, State Zip',
        totalamount: '200.00',
        created_at: '2025-06-09T14:24:29.099Z',
      },
    },
  },
});
