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
      // updated the description as can also use the actors user or ownername a tilde and the actor name in place of the id
      description:
        'The id [defaultDatasetId] of the Actor to get run information [you can also use the username then ~ then the name] (compulsory)',
      required: true,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.apikey;
    const headers = {
      Authorization: 'Bearer ' + apifyToken,
      'Content-Type': 'application/json',
    };

    // removed ?status=SUCCEEDED as we might need to know if a particular actor failed
    const url =
      'https://api.apify.com/v2/acts/' +
      context.propsValue.actorid +
      '/runs/last';
    //?status=SUCCEEDED'

    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };

    const response = await httpClient.sendRequest(httprequestdata);
    return response.body.data;
  },
});
