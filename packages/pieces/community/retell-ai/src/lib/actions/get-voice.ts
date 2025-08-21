import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { retellAiApi } from '../common/api';
import { retellAiCommon } from '../common/props';

export const getVoice = createAction({
  auth: retellAiAuth,
  name: 'get_voice',
  displayName: 'Get a Voice',
  description: 'Retrieve comprehensive details of a specific voice model including provider, gender, accent, age, and preview audio',
  props: {
    voice_id: retellAiCommon.voice_id,
  },
  async run(context) {
    const { voice_id } = context.propsValue;

    try {
      const response = await retellAiApi.get('/v2/get-voice', context.auth, { voice_id });
      
      return {
        success: true,
        voice_id: response.voice_id,
        voice_name: response.voice_name,
        provider: response.provider,
        gender: response.gender,
        accent: response.accent,
        age: response.age,
        preview_audio_url: response.preview_audio_url,
        
        voice_details: {
          id: response.voice_id,
          name: response.voice_name,
          provider: response.provider,
          gender: response.gender,
          accent: response.accent || 'Not specified',
          age: response.age || 'Not specified',
          preview_available: !!response.preview_audio_url,
        },
        
        provider_info: {
          provider_name: response.provider,
          is_elevenlabs: response.provider === 'elevenlabs',
          is_openai: response.provider === 'openai',
          is_deepgram: response.provider === 'deepgram',
        },
        
        audio_preview: response.preview_audio_url ? {
          preview_url: response.preview_audio_url,
          is_available: true,
          can_preview: true,
        } : {
          preview_url: null,
          is_available: false,
          can_preview: false,
        },
        
        message: 'Voice details retrieved successfully',
        raw_response: response,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve voice details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
