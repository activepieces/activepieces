import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDubbingOutputSchema } from '../../output-schemas';

export const getDubbing = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_dubbing',
  outputSchema: elevenlabsGetDubbingOutputSchema,
  displayName: 'Get Dubbing',
  description: 'Get the status of a dubbing job',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a dubbing job with its status (dubbing, dubbed or failed), languages and any error. Poll this after Create Dubbing.',
    idempotent: true,
  },
  props: {
    dubbingId: Property.ShortText({ displayName: 'Dubbing ID', description: 'The dubbing_id returned by Create Dubbing or List Dubbings', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/dubbing/${encodeURIComponent(propsValue.dubbingId)}`,
    });
    return response ?? { success: true };
  },
});
