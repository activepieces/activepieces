import { createAction, Property} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth, baseApiUrl } from '../..';

export const sendSms = createAction({
  auth:famulorAuth,
  name: 'sendSms',
  displayName: 'Send SMS to Customer',
  description: "Send an SMS to a customer using a phone number from our platform.",
  props: {
    from: Property.Dropdown({
      displayName: 'From phone number',
      description: 'Select an SMS capable phone number to send the SMS from',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const res = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: baseApiUrl + 'api/user/phone-numbers',
          headers: {
            Authorization: "Bearer " + auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (res.status !== 200) {
          return {
            disabled: true,
            placeholder: 'Error fetching phone numbers',
            options: [],
          };
        } else if (res.body.length === 0) {
          return {
            disabled: true,
            placeholder: 'No phone numbers found. Purchase an SMS capable phone number first.',
            options: [],
          };
        }

        return {
          options: res.body.map((phoneNumber: any) => ({
            value: phoneNumber.id,
            label: phoneNumber.phone_number,
          })),
        };
      }
    }),
    to: Property.ShortText({
      displayName: 'Customer phone number',
      description: 'Enter the phone number of the customer',
      required: true,
    }),

    body: Property.ShortText({
      displayName: 'Text message',
      description: 'Enter the text message to send to the customer (max 300 characters)',
      required: true,
    }),
  },
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: baseApiUrl + 'api/user/sms',
      body: {
        from: context.propsValue['from'],
        to: context.propsValue['to'],
        body: context.propsValue['body'],
      },
      headers: {
        Authorization: "Bearer " + context.auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });
    return res.body;
  },
});
