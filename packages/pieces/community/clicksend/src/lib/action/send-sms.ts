import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendSmsAction = createAction({
  auth: clicksendAuth,
  name: 'send_sms',
  classification: 'WRITE',
  description: 'Send one or more SMS messages.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends one or more SMS text messages via ClickSend, each with its own recipient phone number (in international format) and body. Choose this to deliver text notifications, alerts, or one-off messages to phone numbers. Not idempotent: each call dispatches the messages again, so repeating it sends duplicates.',
    idempotent: false,
  },
  displayName: 'Send SMS',
  props: {
    messages: Property.Array({
      displayName: 'Messages',
      description: 'Each item is sent as its own SMS.',
      required: true,
      properties: {
        to: Property.ShortText({
          description: 'International format, with the country code.',
          placeholder: '+14155550123',
          displayName: 'To',
          required: true,
        }),
        body: Property.ShortText({
          displayName: 'Message Body',
          required: true,
        }),
        from: Property.ShortText({
          description: 'A sender ID or number approved in ClickSend.',
          displayName: 'From',
          required: false,
        }),
        custom_string: Property.ShortText({
          description: 'Your own tag, returned in delivery reports.',
          displayName: 'Reference',
          required: false,
        }),
        country: Property.ShortText({
          description:
            "Recipient's two-letter country code; helps ClickSend route it.",
          placeholder: 'US',
          displayName: 'Country',
          required: false,
        }),
        message_expiry: Property.Number({
          description: 'How long (in minutes) the message is valid for.',
          displayName: 'Message Expiry',
          required: false,
        }),
        priority: Property.Checkbox({
          description: 'Send as high priority',
          displayName: 'Priority',
          required: false,
        })
      },
    }),
  },
  async run(context) {
    const messages = (context.propsValue.messages as Message[]) ?? [];
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message must be provided.');
    }
    const username = context.auth.username;
    const password = context.auth.password;

    // Map messages to ClickSend API format, ensuring all optional fields are included if provided
    const messageData = {
      messages: messages.map((msg: Message) => {
        const {
          to,
          body,
          from,
          custom_string,
          country,
          message_expiry,
          priority,
        } = msg;
        return {
          to,
          body,
          ...(from && { from }),
          ...(custom_string && { custom_string }),
          ...(country && { country }),
          ...(message_expiry && { message_expiry }),
          ...(priority !== undefined ? { priority } : {}),
        };
      }),
    };

    const response = await callClickSendApi({
      method: HttpMethod.POST,
      path: '/sms/send',
      username,
      password,
      body: messageData,
    });

    return response.body;
  },
});

type Message = {
  to: string;
  body: string;
  from?: string;
  custom_string?: string;
  country?: string;
  message_expiry?: number;
  priority?: boolean;
  list_id?: number;
};
