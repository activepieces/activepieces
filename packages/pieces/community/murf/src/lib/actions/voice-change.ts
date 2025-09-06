import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';

export const voiceChange = createAction({
  name: 'voice_change',
  displayName: 'Voice Change',
  description: 'Transform any voice recording with a new voice using Murf AI',
  props: {
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'URL of the audio file to change voice',
      required: true,
    }),
    target_voice_id: Property.ShortText({
      displayName: 'Target Voice ID',
      description: 'The ID of the target voice',
      required: true,
    }),
    format: Property.Dropdown({
      displayName: 'Audio Format',
      description: 'The format of the output audio file',
      required: true,
      defaultValue: 'mp3',
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
        ],
      },
    }),
    preserve_original_timing: Property.Checkbox({
      displayName: 'Preserve Original Timing',
      description: 'Whether to preserve the original audio timing',
      required: false,
      defaultValue: true,
    }),
    vocal_enhancement: Property.Checkbox({
      displayName: 'Vocal Enhancement',
      description: 'Whether to apply vocal enhancement to the output',
      required: false,
      defaultValue: false,
    }),
    remove_background_noise: Property.Checkbox({
      displayName: 'Remove Background Noise',
      description: 'Whether to remove background noise from the original audio',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const {
      audio_url,
      target_voice_id,
      format,
      preserve_original_timing,
      vocal_enhancement,
      remove_background_noise,
    } = context.propsValue;

    const response = await makeRequest({
      method: HttpMethod.POST,
      apiKey,
      baseUrl,
      path: '/voice/change',
      body: {
        audio_url,
        target_voice_id,
        format,
        preserve_original_timing,
        vocal_enhancement,
        remove_background_noise,
      },
    });

    return response;
  },
});