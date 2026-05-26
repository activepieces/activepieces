import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

interface BroadcastRecord {
  id: string;
  name: string;
  audience_id: string;
  from: string;
  subject: string;
  reply_to: string[];
  preview_text: string;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  sent_at: string | null;
}

export const listBroadcasts = createAction({
  name: 'list_broadcasts',
  auth: resendAuth,
  displayName: 'List Broadcasts',
  description: 'Retrieve all broadcasts in your Resend account',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{ data: BroadcastRecord[] }>({
      method: HttpMethod.GET,
      url: 'https://api.resend.com/broadcasts',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body.data.map((b) => ({
      id: b.id,
      name: b.name ?? '',
      audience_id: b.audience_id,
      from: b.from,
      subject: b.subject,
      reply_to: Array.isArray(b.reply_to) ? b.reply_to.join(', ') : (b.reply_to ?? ''),
      preview_text: b.preview_text ?? '',
      status: b.status,
      created_at: b.created_at,
      scheduled_at: b.scheduled_at ?? '',
      sent_at: b.sent_at ?? '',
    }));
  },
});
