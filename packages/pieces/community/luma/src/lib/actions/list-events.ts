import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

export const lumaListEvents = createAction({
  auth: lumaAuth,
  name: 'list_events',
  displayName: 'List Events',
  description: 'List all events managed by your Luma Calendar',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://public-api.luma.com/v1/calendar/list-events',
      headers: {
        'x-luma-api-key': context.auth.secret_text,
      },
    });

    return response.body;
  },
});
