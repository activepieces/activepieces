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
  classification: 'WRITE',
  displayName: 'Send SMS',
  auth: krispcallAuth,
  description: 'Send a text message from one of your KrispCall numbers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a text-only SMS message from one of the connected KrispCall account numbers to a destination phone number. Use when an agent needs to send a plain SMS; the from number must be one provisioned on the account and the message content is required. Not idempotent — each call dispatches a new message.',
    idempotent: false,
  },
  props: {
    from_number: Property.Dropdown({
      displayName: 'From Number',
      description: 'The KrispCall number the message is sent from.',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      auth: krispcallAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your KrispCall account first.',
          };
        }
        try {
          const authValue = auth.props;
          const res = await httpClient.sendRequest<Item[]>({
            method: HttpMethod.GET,
            url: 'https://app.krispcall.com/api/v3/platform/activepiece/get-numbers',
            headers: {
              'X-API-KEY': authValue.apiKey,
            },
          });
          const numbers = res.body ?? [];
          if (numbers.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No numbers found in your KrispCall account.',
            };
          }
          const mappedOptions = numbers.map((item) => {
            return {
              label: item.name ? `${item.name} (${item.number})` : item.number,
              value: item.number,
            };
          });

          return {
            disabled: false,
            options: mappedOptions,
          };
        } catch (error) {
          console.error(error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not load your numbers. Check your connection.',
          };
        }
      },
    }),
    to_number: Property.ShortText({
      displayName: 'To Number',
      description: 'International format, with the country code.',
      placeholder: '+14155550123',
      required: true,
    }),
    content: Property.ShortText({
      displayName: 'Message',
      placeholder: 'Hi Jane, your order has shipped.',
      required: true,
    }),
  },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['to_number'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['from_number', 'content'],
    },
  ],
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
