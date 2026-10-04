import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskListTicketFormsOutputSchema } from '../../../output-schemas';

export const zendeskListTicketForms = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_forms',
  outputSchema: zendeskListTicketFormsOutputSchema,
  displayName: 'List Ticket Forms',
  description: 'List ticket forms.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists ticket forms with the ticket field IDs each one shows, for Ticket Form ID on Create Ticket.',
    idempotent: true,
  },
  props: {
    active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Filter by active (Yes) or inactive (No). Omit for both.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ ticket_forms: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/ticket_forms.json`,
      queryParams: zendeskApi.query({ active: propsValue.active }),
    });
    return { ticket_forms: response.ticket_forms, count: response.ticket_forms.length };
  },
});
