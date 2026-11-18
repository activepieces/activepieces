import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskRemoveTicketTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_remove_ticket_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Remove Ticket Tags',
  description: 'Remove tags from a ticket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the given tags from one ticket and keeps the rest; tags not on the ticket are ignored. Returns the remaining tag list.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to remove; tags are lowercase and cannot contain spaces.', required: true }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const tags = zendeskApi.stringList(propsValue.tags);
    if (tags.length === 0) {
      throw new Error('Tags must contain at least one tag.');
    }
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.DELETE,
      path: `/tickets/${ticketId}/tags.json`,
      queryParams: {
        tags: tags.join(','),
      },
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
