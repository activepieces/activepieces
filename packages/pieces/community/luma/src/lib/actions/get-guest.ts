import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

export const lumaGetGuest = createAction({
  auth: lumaAuth,
  name: 'get_guest',
  displayName: 'Get Guest',
  description:
    'Get an event guest by looking them up by their ID or email',
  props: {
    event_api_id: Property.ShortText({
      displayName: 'Event API ID',
      description: 'The API ID of the event',
      required: true,
    }),
    guest_api_id: Property.ShortText({
      displayName: 'Guest API ID',
      description: 'The API ID of the guest (provide this or email)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Guest Email',
      description:
        'The email address of the guest (provide this or Guest API ID)',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {
      event_api_id: context.propsValue.event_api_id,
    };

    if (context.propsValue.guest_api_id) {
      queryParams['guest_api_id'] = context.propsValue.guest_api_id;
    }
    if (context.propsValue.email) {
      queryParams['email'] = context.propsValue.email;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://public-api.luma.com/v1/event/get-guest',
      headers: {
        'x-luma-api-key': context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
