import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiReplicateGetPredictionOutputSchema } from '../../../output-schemas';

export const replicateGetPredictionAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_replicate_get_prediction',
  outputSchema: cometapiReplicateGetPredictionOutputSchema,
  displayName: 'Replicate Get Prediction',
  description: 'Reads the status and output of a Replicate prediction.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Replicate prediction once by the id Replicate Create Prediction returns, with its status, output URLs, error and metrics. Call again later while status is not terminal.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Prediction ID',
      description: 'The id returned by Replicate Create Prediction.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/replicate/v1/predictions/${encodeURIComponent(propsValue.id)}`,
    });
  },
});
