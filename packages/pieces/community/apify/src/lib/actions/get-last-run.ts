import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getLastRun = createAction({
  name: 'getLastRun',
  auth: apifyAuth,
  displayName: 'Get last run details',
  description: 'Gets last run details for a given Actor.',
  props: {
    actorid: Property.ShortText({
      displayName: 'The id of the Actor (alphanumeric)',
      description:
        'The id of the Actor to get run information [item of interest:defaultDatasetId] (compulsory)',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth;
    const headers = {
      Authorization: 'Bearer ' + apifyToken,
      'Content-Type': 'application/json',
    };

    const url =
      'https://api.apify.com/v2/acts/' +
      context.propsValue.actorid +
      '/runs/last?status=SUCCEEDED';

    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };

    const response = await httpClient.sendRequest(httprequestdata);
    return response.body;
  },
});
