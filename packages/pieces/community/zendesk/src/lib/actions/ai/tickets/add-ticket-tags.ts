import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskAddTicketTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_add_ticket_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Add Ticket Tags',
  description: 'Add tags to a ticket, keeping its existing tags.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds tags to one ticket and keeps the tags already on it; re-adding an existing tag changes nothing. Returns the full tag list. Update Ticket with Tags replaces the whole set instead. Pass Updated Stamp to fail with 409 rather than race a concurrent change.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to add; tags are lowercase and cannot contain spaces.', required: true }),
    updated_stamp: Property.ShortText({
      displayName: 'Updated Stamp',
      description: 'The updated_at value read from Get Ticket; enables safe update so a concurrent change returns 409.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const tags = zendeskApi.stringList(propsValue.tags);
    if (tags.length === 0) {
      throw new Error('Tags must contain at least one tag.');
    }
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.PUT,
      path: `/tickets/${ticketId}/tags.json`,
      body: {
        tags,
        ...(propsValue.updated_stamp ? { safe_update: true, updated_stamp: propsValue.updated_stamp } : {}),
      },
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
