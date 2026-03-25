import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

export const lumaGetEvent = createAction({
  auth: lumaAuth,
  name: 'get_event',
  displayName: 'Get Event',
  description: 'Get details about a specific event',
  props: {
    event_api_id: Property.ShortText({
      displayName: 'Event API ID',
      description: 'The API ID of the event to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://public-api.luma.com/v1/event/get',
      headers: {
        'x-luma-api-key': context.auth.secret_text,
      },
      queryParams: {
        event_api_id: context.propsValue.event_api_id,
      },
    });

    return response.body;
  },
});
