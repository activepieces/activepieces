import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiFluxGetResultOutputSchema } from '../../../output-schemas';

export const fluxGetResultAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_flux_get_result',
  outputSchema: cometapiFluxGetResultOutputSchema,
  displayName: 'FLUX Get Result',
  description: 'Reads the status and image of a FLUX task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a FLUX task once by the id FLUX Generate Image returns. status Ready means result.sample holds a temporary image URL; Error, Failed, Failure, Task not found, Request Moderated and Content Moderated are final failures; any other status means call again later.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The top-level id returned by FLUX Generate Image.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: '/flux/v1/get_result',
      query: { id: propsValue.id },
    });
  },
});
