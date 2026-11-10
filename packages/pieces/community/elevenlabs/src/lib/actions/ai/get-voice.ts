import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetVoiceOutputSchema } from '../../output-schemas';

export const getVoice = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_voice',
  outputSchema: elevenlabsGetVoiceOutputSchema,
  displayName: 'Get Voice',
  description: 'Get the details of a voice',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Fetches one voice by voice_id, including its name, category, labels, samples, settings and preview URL. Use after List Voices to inspect a voice before using or editing it.',
    idempotent: true,
  },
  props: {
    voiceId: Property.ShortText({ displayName: 'Voice ID', description: 'The voice_id from List Voices', required: true }),
  },
  async run({ auth, propsValue }) {
    return elevenlabsClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/voices/${encodeURIComponent(propsValue.voiceId)}`,
      queryParams: { with_settings: true },
    });
  },
});
