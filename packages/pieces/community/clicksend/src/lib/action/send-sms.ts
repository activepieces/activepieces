import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendSms = createAction({
  auth: clicksendAuth,
  name: 'send_sms',
  description: 'Send one or more SMS messages with full ClickSend API support',
  displayName: 'Send SMS',
  props: {
    messages: Property.Array({
      displayName: 'Messages',
      description: 'List of messages to send (for bulk sending, or just one)',
      required: true,
      properties: {
        to: clicksendCommon.phone_number,
        body: Property.ShortText({
          description: 'The body of the message to send',
          displayName: 'Message Body',
          required: true,
        }),
        from: Property.ShortText({
          description: 'The sender name or number (must be approved in ClickSend)',
          displayName: 'From',
          required: false,
        }),
        schedule: Property.Number({
          description: 'Schedule the message to be sent at a specific timestamp (Unix timestamp)',
          displayName: 'Schedule (Unix Timestamp)',
          required: false,
        }),
        custom_string: Property.ShortText({
          description: 'A custom string for tracking the message',
          displayName: 'Custom String',
          required: false,
        }),
        callback_url: Property.ShortText({
          description: 'URL to receive delivery receipts (webhook)',
          displayName: 'Callback URL',
          required: false,
        }),
        country: Property.ShortText({
          description: 'Country code (for compliance)',
          displayName: 'Country',
          required: false,
        }),
        message_expiry: Property.Number({
          description: 'How long (in minutes) the message is valid for',
          displayName: 'Message Expiry (minutes)',
          required: false,
        }),
        source: Property.ShortText({
          description: 'Source of the message (e.g., "api", "sdk", "web")',
          displayName: 'Source',
          required: false,
          defaultValue: 'api',
        }),
        multipart: Property.Checkbox({
          description: 'Force message to be sent as multipart',
          displayName: 'Multipart',
          required: false,
        }),
        priority: Property.Checkbox({
          description: 'Send as high priority',
          displayName: 'Priority',
          required: false,
        }),
        udh: Property.ShortText({
          description: 'User Data Header (for advanced SMS features)',
          displayName: 'UDH',
          required: false,
        }),
        list_id: Property.Number({
          description: 'Contact list ID to send to (for bulk sending)',
          displayName: 'Contact List ID',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { messages } = context.propsValue;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message must be provided.');
    }
    const username = context.auth.username;
    const password = context.auth.password;

    // Map messages to ClickSend API format, ensuring all optional fields are included if provided
    const messageData = {
      messages: messages.map((msg: any) => {
        const {
          to,
          body,
          from,
          schedule,
          custom_string,
          callback_url,
          country,
          message_expiry,
          source,
          multipart,
          priority,
          udh,
          list_id,
        } = msg;
        return {
          to,
          body,
          ...(from && { from }),
          ...(schedule && { schedule }),
          ...(custom_string && { custom_string }),
          ...(callback_url && { callback_url }),
          ...(country && { country }),
          ...(message_expiry && { message_expiry }),
          source: source || 'api',
          ...(multipart !== undefined ? { multipart } : {}),
          ...(priority !== undefined ? { priority } : {}),
          ...(udh && { udh }),
          ...(list_id && { list_id }),
        };
      }),
    };

    return await callClickSendApi(
      HttpMethod.POST,
      'sms/send',
      { username, password },
      messageData
    );
  },
}); 