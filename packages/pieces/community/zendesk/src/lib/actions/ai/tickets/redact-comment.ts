import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskRedactCommentOutputSchema } from '../../../output-schemas';

export const zendeskRedactComment = createAction({
  auth: zendeskAuth,
  name: 'zendesk_redact_comment',
  outputSchema: zendeskRedactCommentOutputSchema,
  displayName: 'Redact Comment',
  description: 'Permanently remove sensitive text or attachments from a ticket comment.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently redacts parts of one ticket comment, e.g. a card number or password. Read the comment html_body with List Ticket Comments, wrap each sensitive part in <redact></redact> tags, and pass that full HTML as HTML Body; or list attachment URLs to remove. Irreversible. Requires Agent Workspace and an agent allowed to delete tickets; does not work on closed tickets.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    comment_id: zendeskAiProps.requiredId({
      displayName: 'Comment ID',
      description: 'Numeric comment ID, from List Ticket Comments.',
    }),
    html_body: Property.LongText({
      displayName: 'HTML Body',
      description: 'The comment html_body with the text to remove wrapped in <redact></redact> tags.',
      required: false,
    }),
    external_attachment_urls: Property.Array({
      displayName: 'Attachment URLs',
      description: 'content_url values of the comment attachments to redact.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const commentId = zendeskApi.id({ value: propsValue.comment_id, label: 'Comment ID' });
    const urls = zendeskApi.stringList(propsValue.external_attachment_urls);
    if (!propsValue.html_body && urls.length === 0) {
      throw new Error('Pass HTML Body with <redact> tags or Attachment URLs.');
    }
    const response = await zendeskApi.request<{ comment: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/comment_redactions/${commentId}.json`,
      body: zendeskApi.compact({
        ticket_id: Number(ticketId),
        html_body: propsValue.html_body,
        external_attachment_urls: urls.length > 0 ? urls : undefined,
      }),
    });
    return response.comment;
  },
});
