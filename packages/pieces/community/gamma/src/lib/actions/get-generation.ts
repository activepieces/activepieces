import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { gammaAuth } from '../common/auth';

export const getGeneration = createAction({

  auth: gammaAuth,
  name: 'getGeneration',
  displayName: 'Get Generation',
  description: 'Given a Generation ID, fetch the status, outputs, metadata, etc.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches the current status, outputs, and metadata of a Gamma generation job by its generation ID (returned from "Generate Gamma"). Use to poll an in-progress generation until it completes and to retrieve the resulting URLs/files. Read-only and idempotent — safe to call repeatedly while waiting for the job to finish.',
    idempotent: true,
  },
  props: {
    generationId: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The ID of the generation job (from the "Generate Gamma" action).',
      required: true,
    }),
  },
  async run(context) {
    const { generationId } = context.propsValue;
    const apiKey = context.auth.props.apiKey; 

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://public-api.gamma.app/v1.0/generations/${generationId}`,
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    return response.body;
  },
});