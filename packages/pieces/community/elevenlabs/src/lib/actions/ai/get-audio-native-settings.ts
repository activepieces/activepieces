import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetAudioNativeSettingsOutputSchema } from '../../output-schemas';

export const getAudioNativeSettings = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_audio_native_settings',
  outputSchema: elevenlabsGetAudioNativeSettingsOutputSchema,
  displayName: 'Get Audio Native Settings',
  description: 'Get the player settings of an Audio Native project',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns whether the Audio Native project is enabled, its current snapshot id and the player settings.',
    idempotent: true,
  },
  props: {
    projectId: Property.ShortText({ displayName: 'Project ID', description: 'The project_id returned by Create Audio Native Project', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/audio-native/${encodeURIComponent(propsValue.projectId)}/settings`,
    });
    return response ?? { success: true };
  },
});
