import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';

export const getGeneration = createAction({
  auth: alaiAuth,
  name: 'getGeneration',
  displayName: 'Get Generation',
  description: 'Fetch the status and result of a generation job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up the current status and result of an Alai generation job by its generation_id (returned by Generate Presentation or Export Presentation). Use this to poll for completion or retrieve the finished output and export links. Read-only and idempotent. Requires a valid generation_id.',
    idempotent: true,
  },
  props: {
    generationId: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The ID of the generation job (from the "Generate Presentation" action).',
      required: true,
    }),
  },
  async run(context) {
    const { generationId } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://slides-api.getalai.com/api/v1/generations/${generationId}`,
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
        Accept: 'application/json',
      },
    });
    return response.body;
  },
});
