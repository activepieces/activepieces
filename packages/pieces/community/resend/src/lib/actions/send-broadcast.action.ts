import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { sendBroadcastOutputSchema } from '../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';

export const sendBroadcast = createAction({
  name: 'send_broadcast',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Send Broadcast',
  outputSchema: sendBroadcastOutputSchema,
  description: 'Send or schedule a broadcast email to its audience',
  audience: 'both',
  aiMetadata: { description: 'Sends an existing draft broadcast to its entire audience immediately, or schedules it for a future time, identified by broadcast ID. Use this after Create Broadcast to deliver the campaign. Not idempotent — repeating the call can dispatch the broadcast again; optionally pass an ISO 8601 time to schedule rather than send now.', idempotent: false },
  propertyGroups: [
    {
      key: 'send',
      display: 'section',
      label: 'Send',
      icon: 'send',
      props: ['info', 'broadcast_id', 'scheduled_at'],
    },
  ],
  props: {
    info: Property.MarkDown({
      value: "Sends to every subscribed contact in the broadcast's audience.",
      variant: MarkdownVariant.INFO,
    }),
    broadcast_id: resendProps.broadcastId,
    scheduled_at: Property.ShortText({
      displayName: 'Send Time',
      description: 'Empty sends now. ISO 8601, or plain words like in 1 hour.',
      placeholder: '2026-12-01T10:00:00Z',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.scheduled_at) body['scheduled_at'] = propsValue.scheduled_at;

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: `/broadcasts/${propsValue.broadcast_id}/send`, body: body });
  },
});
