import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

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
  auth: resendAuth,
  displayName: 'List Sent Emails',
  description: 'Retrieve a list of emails sent from your Resend account',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{ data: EmailRecord[] }>({
      method: HttpMethod.GET,
      url: 'https://api.resend.com/emails',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body.data.map((email) => ({
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
