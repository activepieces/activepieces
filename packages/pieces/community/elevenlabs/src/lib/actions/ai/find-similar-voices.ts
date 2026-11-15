import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsFindSimilarVoicesOutputSchema } from '../../output-schemas';

export const findSimilarVoices = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_find_similar_voices',
  outputSchema: elevenlabsFindSimilarVoicesOutputSchema,
  displayName: 'Find Similar Voices',
  description: 'Find library voices that sound like an audio sample',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Uploads an audio sample and returns public library voices that sound similar to it. Use to pick a stock voice close to a target speaker. Results carry the ids that Add Shared Voice needs.',
    idempotent: true,
  },
  props: {
    audioFile: Property.File({ displayName: 'Audio Sample', required: true }),
    similarityThreshold: Property.Number({ displayName: 'Similarity Threshold', description: '0 to 2. Lower returns closer matches only', required: false }),
    topK: Property.Number({ displayName: 'Max Results', description: 'Between 1 and 100', required: false }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('audio_file', propsValue.audioFile.data, propsValue.audioFile.filename);
    if (propsValue.similarityThreshold !== undefined) {
      formData.append('similarity_threshold', String(propsValue.similarityThreshold));
    }
    if (propsValue.topK !== undefined) {
      formData.append('top_k', String(propsValue.topK));
    }
    const response = await elevenlabsClient.request<{ voices: Record<string, unknown>[]; has_more: boolean; total_count?: number }>({
      auth,
      method: HttpMethod.POST,
      path: '/v1/similar-voices',
      formData,
    });
    return {
      voices: response.voices,
      count: response.voices.length,
      has_more: response.has_more,
      total_count: response.total_count ?? null,
    };
  },
});
