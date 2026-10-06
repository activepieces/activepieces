import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskMakeCommentPrivateOutputSchema } from '../../../output-schemas';

export const zendeskMakeCommentPrivate = createAction({
  auth: zendeskAuth,
  name: 'zendesk_make_comment_private',
  outputSchema: zendeskMakeCommentPrivateOutputSchema,
  displayName: 'Make Comment Private',
  description: 'Turn a public ticket comment into an internal note.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes one public comment on a ticket private, hiding it from the requester; it cannot be made public again. The comment ID comes from List Ticket Comments. Use Redact Comment to remove sensitive text instead of hiding the whole comment.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    comment_id: zendeskAiProps.requiredId({ displayName: 'Comment ID', description: 'Numeric comment ID, from List Ticket Comments.' }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const commentId = zendeskApi.id({ value: propsValue.comment_id, label: 'Comment ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/tickets/${ticketId}/comments/${commentId}/make_private.json`,
    });
    return { success: true, ticket_id: Number(ticketId), comment_id: Number(commentId) };
  },
});
