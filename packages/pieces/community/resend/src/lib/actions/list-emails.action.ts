import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listEmailsOutputSchema } from '../output-schemas';

interface EmailRecord {
  id: string;
  to: string[] | null;
  from: string;
  created_at: string;
  subject: string;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  last_event: string;
  scheduled_at: string | null;
}

export const listEmails = createAction({
  name: 'list_emails',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Sent Emails',
  outputSchema: listEmailsOutputSchema,
  description: 'Retrieve a list of emails sent from your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the list of emails sent from the connected Resend account, including their IDs, recipients, subjects, and latest delivery event. Use this to discover email IDs (e.g. to feed Get Email Status, Cancel Scheduled Email, or Reschedule Email) or to audit recent sends. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{ data: EmailRecord[] }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/emails' });
    return response.data.map((email) => ({
      id: email.id,
      from: email.from,
      to: (email.to ?? []).join(', '),
      subject: email.subject,
      last_event: email.last_event,
      created_at: email.created_at,
      scheduled_at: email.scheduled_at ?? '',
      cc: (email.cc ?? []).join(', '),
      bcc: (email.bcc ?? []).join(', '),
      reply_to: (email.reply_to ?? []).join(', '),
    }));
  },
});
