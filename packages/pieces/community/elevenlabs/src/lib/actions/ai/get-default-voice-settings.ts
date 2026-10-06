import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDefaultVoiceSettingsOutputSchema } from '../../output-schemas';

export const getDefaultVoiceSettings = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_default_voice_settings',
  outputSchema: elevenlabsGetDefaultVoiceSettingsOutputSchema,
  displayName: 'Get Default Voice Settings',
  description: 'Get the default text-to-speech voice settings',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the default voice settings (stability, similarity_boost, style, speed, use_speaker_boost) applied to voices that have no custom settings. Use as a reference before tuning a voice.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return elevenlabsClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: '/v1/voices/settings/default',
    });
  },
});
