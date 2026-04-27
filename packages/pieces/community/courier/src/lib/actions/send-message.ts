import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { courierAuth } from '../common/auth';
import { courierApiCall } from '../common/client';

export const sendMessage = createAction({
  auth: courierAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a notification via any channel (email, SMS, push, Slack, etc.) using Courier.',
  props: {
    recipient_id: Property.ShortText({
      displayName: 'Recipient ID',
      description: 'The ID of the recipient (user or list).',
      required: true,
    }),
    event: Property.ShortText({
      displayName: 'Event/Notification ID',
      description: 'The Courier notification event to trigger.',
      required: false,
    }),
    message_content: Property.Json({
      displayName: 'Message Content',
      description: 'Direct message content (used if no event specified). Example: {"title":"Hi","body":"Hello!"}',
      required: false,
    }),
    data: Property.Json({
      displayName: 'Data',
      description: 'Data variables to pass to the notification template.',
      required: false,
    }),
    channels: Property.Array({
      displayName: 'Channels',
      description: 'Channels to send through (e.g., ["email", "sms"]).',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body: Record<string, unknown> = {
      recipient: props.recipient_id,
    };

    if (props.event) body['event'] = props.event;
    if (props.message_content) body['message'] = props.message_content;
    if (props.data) body['data'] = props.data;
    if (props.channels && props.channels.length > 0) {
      body['channels'] = props.channels;
    }

    const response = await courierApiCall<{ requestId: string }>({
      method: HttpMethod.POST,
      path: '/send',
      apiKey: context.auth,
      body,
    });

    return response.body;
  },
});
