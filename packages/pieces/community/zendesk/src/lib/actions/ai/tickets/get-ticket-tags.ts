import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskGetTicketTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_ticket_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Get Ticket Tags',
  description: 'List the tags on a ticket.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the tags currently on one ticket. Change them with Add Ticket Tags or Remove Ticket Tags.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/tags.json`,
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
