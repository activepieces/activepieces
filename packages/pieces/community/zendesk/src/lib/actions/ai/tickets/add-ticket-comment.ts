import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddTicketCommentOutputSchema } from '../../../output-schemas';

export const zendeskAddTicketComment = createAction({
  auth: zendeskAuth,
  name: 'zendesk_add_ticket_comment',
  outputSchema: zendeskAddTicketCommentOutputSchema,
  displayName: 'Add Ticket Comment',
  description: 'Reply to a ticket or add an internal note.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a comment to a ticket: a public reply emailed to the requester, or an internal note when Public is false. Optionally sets the ticket status in the same update, e.g. pending after asking the customer a question. Not idempotent: every call appends another comment, so check List Ticket Comments before retrying.',
    idempotent: false,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    body: Property.LongText({ displayName: 'Comment Body', required: true }),
    is_html: Property.Checkbox({
      displayName: 'Comment Is HTML',
      description: 'Send Comment Body as HTML instead of plain text.',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public',
      description: 'true (default) replies to the requester; false adds an internal note only agents see.',
      required: false,
    }),
    author_id: zendeskAiProps.optionalId({
      displayName: 'Author ID',
      description: 'User ID to post as. Defaults to the connected user.',
    }),
    status: zendeskAiProps.ticketStatus({ description: 'Optional status to set together with the comment.' }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const ticketId = zendeskApi.id({ value: p.ticket_id, label: 'Ticket ID' });
    return zendeskApi.request<{ ticket: Record<string, unknown>; audit: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/tickets/${ticketId}.json`,
      body: {
        ticket: zendeskApi.compact({
          comment: zendeskApi.compact({
            [p.is_html ? 'html_body' : 'body']: p.body,
            public: p.public,
            author_id: zendeskApi.optionalId({ value: p.author_id, label: 'Author ID' }),
          }),
          status: p.status,
        }),
      },
    });
  },
});
