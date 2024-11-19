import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getDatasetItems = createAction({
  name: 'getDatasetItems',
  auth: apifyAuth,
  displayName: 'Get Dataset Items',
  description: 'Gets the data from an Actors run.',
  props: {
    runid: Property.ShortText({
      displayName: 'The runid of the Actor (alphanumeric)',
      description:
        'The runid of the completed Actors run [defaultDatasetId] (compulsory)',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.apikey;
    const headers = {
      Authorization: 'Bearer ' + apifyToken,
      'Content-Type': 'application/json',
    };

    const url =
      'https://api.apify.com/v2/datasets/' +
      context.propsValue.runid +
      '/items/';

    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };

    const response = await httpClient.sendRequest(httprequestdata);
    return response.body;
  },
});
