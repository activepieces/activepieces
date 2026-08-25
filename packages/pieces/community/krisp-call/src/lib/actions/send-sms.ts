import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../auth';
import { Property, PiecePropValueSchema } from '@activepieces/pieces-framework';

interface Item {
  name: string;
  id: string;
  number: string;
}

export const sendSms = createAction({
  name: 'sendSms',
  displayName: 'Send SMS',
  auth: krispcallAuth,
  description: 'Send sms in Krispcall.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a text-only SMS message from one of the connected KrispCall account numbers to a destination phone number. Use when an agent needs to send a plain SMS; the from number must be one provisioned on the account and the message content is required. Not idempotent — each call dispatches a new message.',
    idempotent: false,
  },
  props: {
    from_number: Property.Dropdown({
      displayName: 'From Number',
      description: 'Select an Number',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      auth: krispcallAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const authVaue = auth.props;
          const res = await httpClient.sendRequest<Item[]>({
            method: HttpMethod.GET,
            url: 'https://app.krispcall.com/api/v3/platform/activepiece/get-numbers',
            headers: {
              'X-API-KEY': authVaue.apiKey,
            },
          });
          const mappedOptions = res?.body?.map((item) => {
            return {
              label: item.name,
              value: item.number,
            };
          });

          return {
            disabled: false,
            options: mappedOptions,
          };
        } catch (error) {
          // Handle error
          console.error(error);
          return { disabled: true, options: [] }; // Return empty options array or handle error accordingly
        }
      },
    }),
    to_number: Property.ShortText({
      displayName: 'To Number',
      description: 'Enter the number to which you want to send sms.',
      required: true,
    }),
    content: Property.ShortText({
      displayName: 'content',
      description: 'Enter your message here.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/send-sms',
      headers: {
        'X-API-KEY': auth.props.apiKey,
      },

      body: {
        from_number: propsValue.from_number,
        to_number: propsValue.to_number,
        content: propsValue.content,
      },
    });
    return res.body;
  },
});
