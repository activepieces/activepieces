import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listReceivedEmailsOutputSchema } from '../output-schemas';

interface ReceivedEmailRecord {
  id: string;
  to: string[] | null;
  from: string;
  created_at: string;
  subject: string;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
}

export const listReceivedEmails = createAction({
  name: 'list_received_emails',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Received Emails',
  outputSchema: listReceivedEmailsOutputSchema,
  description: 'Retrieve emails received on an inbound domain',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves inbound emails received on a domain configured for receiving, including sender, recipients, and subject. Use this to check for and process incoming mail. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{ data: ReceivedEmailRecord[] }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/emails/receiving' });
    return response.data.map((email) => ({
      id: email.id,
      from: email.from,
      to: (email.to ?? []).join(', '),
      subject: email.subject,
      created_at: email.created_at,
      cc: (email.cc ?? []).join(', '),
      bcc: (email.bcc ?? []).join(', '),
      reply_to: (email.reply_to ?? []).join(', '),
    }));
  },
});
