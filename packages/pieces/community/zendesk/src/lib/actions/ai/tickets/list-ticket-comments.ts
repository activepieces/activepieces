import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketCommentsOutputSchema } from '../../../output-schemas';

export const zendeskListTicketComments = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_comments',
  outputSchema: zendeskListTicketCommentsOutputSchema,
  displayName: 'List Ticket Comments',
  description: 'List the comments on a ticket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the public replies and internal notes on one ticket, with author, body, attachments and public flag. Set Sort Order to newest first with Limit 1 to read the latest comment. Pass next_page back as Page while has_more is true. Comment IDs feed Make Comment Private and Redact Comment; attachment IDs feed Get Attachment.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'asc for oldest first (default), desc for newest first.',
      required: false,
      options: { options: [{ label: 'Oldest first', value: 'asc' }, { label: 'Newest first', value: 'desc' }] },
    }),
    limit: zendeskAiProps.limit(),
    page: zendeskAiProps.page(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ comments: unknown[]; next_page?: string | null }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/comments.json`,
      queryParams: {
        ...zendeskApi.offsetQuery({ limit: propsValue.limit, page: propsValue.page }),
        ...zendeskApi.query({ sort_order: propsValue.sort_order }),
      },
    });
    return {
      comments: response.comments,
      count: response.comments.length,
      ...zendeskApi.offsetResult({ nextPage: response.next_page, page: propsValue.page }),
    };
  },
});
