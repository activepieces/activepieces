import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { autocallsAuth, baseApiUrl } from '../..';

export const makePhoneCall = createAction({
  auth:autocallsAuth,
  name: 'makePhoneCall',
  displayName: 'Make Phone Call',
  description: "Call a customer by it's phone number using an assistant from our platform.",
  props: {
    assistant: Property.Dropdown({
      displayName: 'Assistant',
      description: 'Select an assistant',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const res = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: baseApiUrl + 'api/user/assistants/outbound',
          headers: {
            Authorization: "Bearer " + auth,
          },
        });

        if (res.status !== 200) {
          return {
            disabled: true,
            placeholder: 'Error fetching assistants',
            options: [],
          };
        } else if (res.body.length === 0) {
          return {
            disabled: true,
            placeholder: 'No outbound assistants found. Create one first.',
            options: [],
          };
        }

        return {
          options: res.body.map((assistant: any) => ({
            value: assistant.id,
            label: assistant.name,
          })),
        };
      }
    }),
    phone_number: Property.ShortText({
      displayName: 'Customer phone number',
      description: 'Enter the phone number of the customer',
      required: true,
    }),

    variables: Property.Object({
      displayName: 'Variables',
      description: 'Variables to pass to the assistant',
      required: true,
      defaultValue: {
        customer_name: 'John',
      }
    })
  },
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: baseApiUrl + 'api/user/make_call',
      body: {
        assistant_id: context.propsValue['assistant'],
        phone_number: context.propsValue['phone_number'],
        variables: context.propsValue['variables'],
      },
      headers: {
        Authorization: "Bearer " + context.auth,
      },
    });
    return res.body;
  },
});
