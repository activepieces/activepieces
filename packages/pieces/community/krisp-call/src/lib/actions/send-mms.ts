import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../auth';
import { Property, PiecePropValueSchema } from '@activepieces/pieces-framework';

interface Item {
  name: string;
  id: string;
  number: string;
}

export const sendMms = createAction({
  name: 'sendMms',
  classification: 'WRITE',
  displayName: 'Send MMS',
  auth: krispcallAuth,
  description: 'Send images or files from one of your KrispCall numbers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send an MMS message carrying one or more media URLs from a connected KrispCall account number to a destination phone number, with optional text content. Use when an agent needs to send media (images/files) rather than a plain SMS; the from number must be provisioned on the account and at least one media URL is required. Not idempotent — each call dispatches a new message.',
    idempotent: false,
  },
  props: {
    from_number: Property.Dropdown({
      auth: krispcallAuth,
      displayName: 'From Number',
      description: 'The KrispCall number the message is sent from.',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
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
      description: 'Optional text sent with the media.',
      required: false,
    }),
    medias: Property.Array({
      displayName: 'Media URLs',
      description: 'Public links to the images or files to send, one per item.',
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
      props: ['from_number', 'content', 'medias'],
    },
  ],
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/send-mms',
      headers: {
        'X-API-KEY': auth.props.apiKey,
      },

      body: {
        from_number: propsValue.from_number,
        to_number: propsValue.to_number,
        content: propsValue.content,
        medias: propsValue.medias,
      },
    });
    return res.body;
  },
});
