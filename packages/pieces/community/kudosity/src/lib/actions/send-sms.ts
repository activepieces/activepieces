import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendSms = createAction({
  auth: kudosityAuth,
  name: 'sendSms',
  displayName: 'Send SMS',
  description: 'Send an SMS message via Kudosity',
  audience: 'both',
  aiMetadata: {
    description:
      'Send an SMS text message to a recipient via Kudosity. Use when an automation needs to deliver an outbound text. Requires a sender (number or alphanumeric ID assigned to the account), a recipient (local or E.164), and the message body; an optional message reference and link tracking can be set. Not idempotent — each call dispatches a new message.',
    idempotent: false,
  },
  props: {
    sender: Property.ShortText({
      displayName: 'Sender',
      description:
        'Sender number or alphanumeric sender that is assigned to your account',
      required: true,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'Destination number (local or E.164 format)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Body of the SMS message',
      required: true,
    }),
    messageRef: Property.ShortText({
      displayName: 'Message Reference',
      description:
        'Optional reference string to correlate messages with your system',
      required: false,
    }),
    trackLinks: Property.Checkbox({
      displayName: 'Track Links',
      description: 'Enable link tracking for this message',
      required: false,
    }),
  },
  async run(context) {
    const payload: any = {
      sender: context.propsValue.sender,
      recipient: context.propsValue.recipient,
      message: context.propsValue.message,
    };

    if (context.propsValue.messageRef)
      payload.message_ref = context.propsValue.messageRef;
    if (context.propsValue.trackLinks !== undefined)
      payload.track_links = context.propsValue.trackLinks;

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.transmitmessage.com/v2/sms',
      headers: {
        'x-api-key': `${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return res;
  },
});
