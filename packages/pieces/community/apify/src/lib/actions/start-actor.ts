import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const startActor = createAction({
  // https://api.apify.com/v2/acts/{actorId}/run-sync
  // https://api.apify.com/v2/acts/{actorId}/runs
  name: 'startActor',
  auth: apifyAuth,
  displayName: 'Start an Apify Actor',
  description: 'Starts an Apify Actor web scraper',
  props: {
    actorid: Property.ShortText({
      displayName: 'The id or name of the Actor (alphanumeric)',
      description:
        'The id of the Actor to run [Use either id, or the username then ~ then the name] (compulsory)',
      required: true,
    }),
    jsonbody: Property.Json({
      displayName: 'JSON input',
      description:
        'The JSON input to pass to the Actor [you can get the JSON from a run in your Apify account]. If left blank will use defaults. (optional)',
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
      'https://api.apify.com/v2/acts/' + context.propsValue.actorid + '/runs/';

    const httprequestdata = {
      method: HttpMethod.POST,
      url,
      headers,
      body: JSON.stringify(context.propsValue.jsonbody),
    };

    const response = await httpClient.sendRequest(httprequestdata);
    return response.body.data;
  },
});
