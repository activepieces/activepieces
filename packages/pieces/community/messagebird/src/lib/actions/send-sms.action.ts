import { birdAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const sendSMSAction = createAction({
  auth: birdAuth,
  name: 'send-sms',
  displayName: 'Send SMS',
  description: 'Sends an SMS message via Bird Channels API.',
  audience: 'both',
  aiMetadata: { description: 'Send an outbound SMS text message to a phone number through the Bird (MessageBird) Channels API, using the workspace and channel configured in the connection. Choose this to deliver a text message to a single recipient; the recipient must be an E.164 phone number including country code. Optionally schedule it for a future UTC timestamp instead of sending immediately. Not idempotent — each call sends (or schedules) a new message.', idempotent: false },
  props: {
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'The phone number to send the message to (with country code)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The body of the SMS message',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your own identifier for the message (optional)',
      required: false,
    }),
    scheduledFor: Property.DateTime({
      displayName: 'Scheduled For (UTC timestamp)',
      description: 'Message to be sent at a specific datetime eg. 2025-04-27T15:08:18.613Z. If not set, the message will be sent immediately.',
      required: false,
    }),
  },
  async run(context) {
    const { recipient, message, reference, scheduledFor } = context.propsValue;
    const auth = context.auth.props;
    
    // Format request for Bird Channels API
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.bird.com/workspaces/${auth.workspaceId}/channels/${auth.channelId}/messages`,
      headers: {
        'Authorization': `Bearer ${auth.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        receiver: {
          contacts: [
            {
              identifierValue: recipient
            }
          ]
        },
        body: {
          type: 'text',
          text: {
            text: message
          }
        },
        ...(reference && { reference }),
        ...(scheduledFor && { scheduledFor }),
      },
    };

    return await httpClient.sendRequest(request);
  },
});
