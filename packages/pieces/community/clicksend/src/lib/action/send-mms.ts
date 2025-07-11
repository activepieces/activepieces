import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendMms = createAction({
  auth: clicksendAuth,
  name: 'send_mms',
  description: 'Send one or more MMS messages with full ClickSend API support',
  displayName: 'Send MMS',
  props: {
    messages: Property.Array({
      displayName: 'Messages',
      description: 'List of MMS messages to send (for bulk sending, or just one)',
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
        media_url: Property.ShortText({
          description: 'The URL of the media file to send (image, video, etc.)',
          displayName: 'Media URL',
          required: true,
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
          description: 'User Data Header (for advanced MMS features)',
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

    // Validate each message
    for (const msg of messages) {
      const m = msg as any;
      if (!m.to || !m.body || !m.media_url) {
        throw new Error('Each message must have a recipient (to), body, and media_url.');
      }
      // Optionally, add more validation for media_url format, etc.
    }

    // Map messages to ClickSend API format, ensuring all optional fields are included if provided
    const messageData = {
      messages: messages.map((msg: any) => {
        const {
          to,
          body,
          from,
          media_url,
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
          media_url,
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

    try {
      return await callClickSendApi(
        HttpMethod.POST,
        'mms/send',
        { username, password },
        messageData
      );
    } catch (error: any) {
      // Handle ClickSend API errors and provide meaningful feedback
      if (error?.response?.body?.response_msg) {
        throw new Error(`ClickSend API error: ${error.response.body.response_msg}`);
      }
      throw error;
    }
  },
}); 