import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { gammaAuth } from '../common/auth';

export const getGeneration = createAction({

  auth: gammaAuth,
  name: 'getGeneration',
  displayName: 'Get Generation',
  description: 'Given a Generation ID, fetch the status, outputs, metadata, etc.',
  props: {
    generationId: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The ID of the generation job (from the "Generate Gamma" action).',
      required: true,
    }),
  },
  async run(context) {
    const { generationId } = context.propsValue;
    const apiKey = context.auth.apiKey; 

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://public-api.gamma.app/v0.2/generations/${generationId}`,
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    return response.body;
  },
});