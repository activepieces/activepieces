import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetTicketTriggerOutputSchema } from '../../../output-schemas';

export const zendeskGetTicketTrigger = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_ticket_trigger',
  outputSchema: zendeskGetTicketTriggerOutputSchema,
  displayName: 'Get Ticket Trigger',
  description: 'Get a ticket trigger by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one ticket trigger with its conditions and actions. Requires an admin.',
    idempotent: true,
  },
  props: {
    trigger_id: zendeskAiProps.requiredId({ displayName: 'Trigger ID', description: 'Numeric trigger ID, from List or Search Ticket Triggers.' }),
  },
  async run({ auth, propsValue }) {
    const triggerId = zendeskApi.id({ value: propsValue.trigger_id, label: 'Trigger ID' });
    const response = await zendeskApi.request<{ trigger: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/triggers/${triggerId}.json`,
    });
    return response.trigger;
  },
});
