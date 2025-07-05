import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { countryDropdown } from '../common/props';

export const sendSms = createAction({
  auth: clicksendAuth,
  name: 'sendSms',
  displayName: 'Send SMS',
  description: 'Send SMS messages to recipients using ClickSend API',
  props: {
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The text content of the SMS message',
      required: true,
    }),
    to: Property.Array({
      displayName: 'Recipient Phone Numbers',
      description: 'Phone numbers to send the SMS to (e.g., +61411111111)',
      required: true,
      defaultValue: [],
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source identifier for the message (optional)',
      required: false,
    }),
    schedule: Property.Number({
      displayName: 'Schedule Time (Unix Timestamp)',
      description:
        'Schedule the message to be sent at a specific time (Unix timestamp)',
      required: false,
    }),
    custom_string: Property.ShortText({
      displayName: 'Custom String',
      description: 'Custom string for tracking purposes',
      required: false,
    }),
    list_id: Property.Number({
      displayName: 'List ID',
      description: 'Contact list ID to send to (alternative to phone numbers)',
      required: false,
    }),
    from_email: Property.ShortText({
      displayName: 'From Email',
      description: 'Email address to send from (if applicable)',
      required: false,
    }),
    shorten_urls: Property.Checkbox({
      displayName: 'Shorten URLs',
      description: 'Automatically shorten URLs in the message',
      required: false,
      defaultValue: false,
    }),
    sender_id: Property.ShortText({
      displayName: 'Sender ID',
      description:
        'Custom sender ID (alpha tag, dedicated number, or shared number)',
      required: false,
    }),
    sender_country: countryDropdown,
  },
  async run({ auth, propsValue }) {
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    // Prepare messages array
    const messages = (propsValue.to as string[]).map((phoneNumber: string) => ({
      body: propsValue.body,
      to: phoneNumber,
      source: propsValue.source || undefined,
      schedule: propsValue.schedule || undefined,
      custom_string: propsValue.custom_string || undefined,
      list_id: propsValue.list_id || undefined,
      from_email: propsValue.from_email || undefined,
    }));
    // Prepare request body
    const requestBody: any = {
      messages,
    };
    if (propsValue.shorten_urls !== undefined) {
      requestBody.shorten_urls = propsValue.shorten_urls;
    }
    if (propsValue.sender_id && propsValue.sender_country) {
      requestBody.senders = [
        {
          country: propsValue.sender_country,
          sender_id: propsValue.sender_id,
        },
      ];
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/sms/send',
      undefined,
      requestBody
    );
    return response;
  },
});
