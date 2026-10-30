import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskListCustomStatusesOutputSchema } from '../../../output-schemas';

export const zendeskListCustomStatuses = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_custom_statuses',
  outputSchema: zendeskListCustomStatusesOutputSchema,
  displayName: 'List Custom Statuses',
  description: 'List the custom ticket statuses.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the ticket statuses defined in the account with their IDs and status category, for Custom Status ID on Update Ticket and Update Many Tickets.',
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
    const response = await zendeskApi.request<{ custom_statuses: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/custom_statuses.json`,
      queryParams: zendeskApi.query({ active: propsValue.active }),
    });
    return { custom_statuses: response.custom_statuses, count: response.custom_statuses.length };
  },
});
