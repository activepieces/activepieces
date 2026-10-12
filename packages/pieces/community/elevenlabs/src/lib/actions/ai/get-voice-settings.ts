import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetDefaultVoiceSettingsOutputSchema } from '../../output-schemas';

export const getVoiceSettings = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_voice_settings',
  outputSchema: elevenlabsGetDefaultVoiceSettingsOutputSchema,
  displayName: 'Get Voice Settings',
  description: 'Get the stability, similarity, style and speed settings of a voice',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the current text-to-speech settings of a voice: stability, similarity_boost, style, speed and use_speaker_boost. Use before Edit Voice Settings to see what will change.',
    idempotent: true,
  },
  props: {
    voiceId: Property.ShortText({ displayName: 'Voice ID', description: 'The voice_id from List Voices', required: true }),
  },
  async run({ auth, propsValue }) {
    return elevenlabsClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/voices/${encodeURIComponent(propsValue.voiceId)}/settings`,
    });
  },
});
