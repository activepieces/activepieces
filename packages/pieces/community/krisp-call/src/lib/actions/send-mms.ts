import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../..';
import { Property, PiecePropValueSchema } from '@activepieces/pieces-framework';

interface Item {
  name: string;
  id: string;
  number: string;
}

export const sendMms = createAction({
  name: 'sendMms',
  displayName: 'Send MMS',
  auth: krispcallAuth,
  description: 'Send mms in krispcall.',
  props: {
    from_number: Property.Dropdown({
      displayName: 'from number',
      description: 'Select an number',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        try {
          const authVaue = auth as PiecePropValueSchema<typeof krispcallAuth>;
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
      required: false,
    }),
    medias: Property.Array({
      displayName: 'Medias url',
      description: 'Enter medias urls',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    console.log(auth.apiKey);
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/send-mms',
      headers: {
        'X-API-KEY': auth.apiKey,
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
