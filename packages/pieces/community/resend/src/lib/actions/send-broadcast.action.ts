import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const sendBroadcast = createAction({
  name: 'send_broadcast',
  auth: resendAuth,
  displayName: 'Send Broadcast',
  description: 'Send or schedule a broadcast email to its audience',
  props: {
    broadcast_id: resendProps.broadcastId,
    scheduled_at: Property.ShortText({
      displayName: 'Schedule For',
      description:
        'ISO 8601 date-time to schedule the send, e.g. 2024-12-01T10:00:00Z. Leave blank to send immediately.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.scheduled_at) body['scheduled_at'] = propsValue.scheduled_at;

    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.POST,
      url: `https://api.resend.com/broadcasts/${propsValue.broadcast_id}/send`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body,
    });
    return response.body;
  },
});
