import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteDubbingOutputSchema } from '../../output-schemas';

export const deleteDubbing = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_delete_dubbing',
  outputSchema: elevenlabsDeleteDubbingOutputSchema,
  displayName: 'Delete Dubbing',
  description: 'Permanently delete a dubbing project',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a dubbing project and its results. Cannot be undone; a second call on the same id fails.',
    idempotent: false,
  },
  props: {
    dubbingId: Property.ShortText({ displayName: 'Dubbing ID', description: 'The dubbing_id from List Dubbings', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.DELETE,
      path: `/v1/dubbing/${encodeURIComponent(propsValue.dubbingId)}`,
    });
    return response ?? { success: true };
  },
});
