import { createAction } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getActors = createAction({
  name: 'getActors',
  auth: apifyAuth,
  displayName: "Get user's Actors",
  description: 'Gets the list of Actors available to the user.',
  props: {},
  async run(context) {
    const apifyToken = context.auth.apikey;
    const headers = {
      Authorization: 'Bearer ' + apifyToken,
      'Content-Type': 'application/json',
    };

    const url = 'https://api.apify.com/v2/acts/';

    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };

    const response = await httpClient.sendRequest(httprequestdata);
    return response.body;
  },
});
