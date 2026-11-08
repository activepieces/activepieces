import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { compactBody, freshserviceApiCall } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiReplyToTicket = createAction({
  auth: freshserviceAuth,
  name: 'ai_reply_to_ticket',
  displayName: 'Reply to Ticket (AI)',
  description: 'Sends a public reply on a Freshservice ticket.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.conversation,
  aiMetadata: {
    description:
      'Sends a public reply on a Freshservice ticket by numeric ticket id; the requester receives it by email. Use Add Ticket Note for internal comments. Not idempotent — each call sends another email.',
    idempotent: false,
  },
  props: {
    ticket_id: Property.Number({ displayName: 'Ticket ID', required: true }),
    body: Property.LongText({ displayName: 'Reply', description: 'HTML is allowed.', required: true }),
    cc_emails: Property.Array({ displayName: 'CC Emails', required: false }),
    bcc_emails: Property.Array({ displayName: 'BCC Emails', required: false }),
  },
  async run(context) {
    const { ticket_id, body, cc_emails, bcc_emails } = context.propsValue;
    const response = await freshserviceApiCall<{ conversation: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `tickets/${ticket_id}/reply`,
      auth: context.auth,
      body: compactBody({ body, cc_emails, bcc_emails }),
    });
    return response.body.conversation;
  },
});
