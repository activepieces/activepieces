import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

export const translateVideoAction = createAction({
  auth: heygenAuth,
  name: 'translate_video',
  displayName: 'Translate Video',
  description: 'Translate a video into 175+ languages with natural voice and lip-sync.',
  props: {
    video_url: Property.ShortText({
      displayName: 'Video URL',
      required: true,
      description: 'URL of the video file to be translated. Supports direct URLs, Google Drive, and YouTube.',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
      description: 'Optional title of the translated video.',
    }),
    output_language: Property.ShortText({
      displayName: 'Output Language',
      required: true,
      description: 'Target language for translation (e.g., "en", "fr", "es").',
    }),
    translate_audio_only: Property.Checkbox({
      displayName: 'Translate Audio Only',
      required: false,
      defaultValue: false,
      description: 'Only translate the audio without modifying faces.',
    }),
    speaker_num: Property.Number({
      displayName: 'Number of Speakers',
      required: false,
      description: 'Number of speakers in the video (if applicable).',
    }),
    callback_id: Property.ShortText({
      displayName: 'Callback ID',
      required: false,
      description: 'Custom ID returned in webhook callback.',
    }),
    enable_dynamic_duration: Property.Checkbox({
      displayName: 'Enable Dynamic Duration',
      required: false,
      defaultValue: false,
      description: 'Stretches/shrinks video segments for improved translation flow.',
    }),
    brand_voice_id: Property.ShortText({
      displayName: 'Brand Voice ID',
      required: false,
      description: 'Use a custom Brand Voice for translation.',
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      required: false,
      description: 'URL to notify when translation is complete.',
    }),
  },
  async run({ propsValue, auth }) {
    const {
      video_url,
      title,
      output_language,
      translate_audio_only,
      speaker_num,
      callback_id,
      enable_dynamic_duration,
      brand_voice_id,
      callback_url,
    } = propsValue;

    const body: Record<string, unknown> = {
      video_url,
      output_language,
    };

    if (title) body['title'] = title;
    if (translate_audio_only !== undefined) body['translate_audio_only'] = translate_audio_only;
    if (speaker_num !== undefined) body['speaker_num'] = speaker_num;
    if (callback_id) body['callback_id'] = callback_id;
    if (enable_dynamic_duration !== undefined) body['enable_dynamic_duration'] = enable_dynamic_duration;
    if (brand_voice_id) body['brand_voice_id'] = brand_voice_id;
    if (callback_url) body['callback_url'] = callback_url;

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/v2/video_translate',
      body
    );

    return response;
  },
});
