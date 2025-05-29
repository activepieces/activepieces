import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const translateAVideo = createAction({
  name: 'translateAVideo',
  displayName: 'Translate a Video',
  description: 'Translate videos into 175+ languages with natural voice and perfect lip-sync. Note: This feature requires a HeyGen Team plan or higher subscription.',
  props: {
    video_url: Property.ShortText({
      displayName: 'Video URL',
      description: 'The URL of the video file to be translated. Supports direct video file URLs, Google Drive URLs, and YouTube URLs',
      required: true,
    }),
    output_language: Property.ShortText({
      displayName: 'Output Language',
      description: 'The target language in which the video will be translated',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the video',
      required: false,
    }),
    translate_audio_only: Property.Checkbox({
      displayName: 'Translate Audio Only',
      description: 'Translate only the audio, ignore the faces and only translate the voice track in this video',
      required: false,
      defaultValue: false,
    }),
    speaker_num: Property.Number({
      displayName: 'Number of Speakers',
      description: 'Number of speakers in the video',
      required: false,
    }),
    callback_id: Property.ShortText({
      displayName: 'Callback ID',
      description: 'A custom ID for callback purposes',
      required: false,
    }),
    enable_dynamic_duration: Property.Checkbox({
      displayName: 'Enable Dynamic Duration',
      description: 'Enable dynamic duration, which stretches or shrinks portions of your video to enhance conversational fluidity and translation quality between languages with different speaking rates',
      required: false,
      defaultValue: false,
    }),
    brand_voice_id: Property.ShortText({
      displayName: 'Brand Voice ID',
      description: 'A Brand Voice that gets incorporated to the translation',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'An optional callback url for video completion notification',
      required: false,
    }),
  },
  async run(context) {
    const {
      video_url,
      output_language,
      title,
      translate_audio_only,
      speaker_num,
      callback_id,
      enable_dynamic_duration,
      brand_voice_id,
      callback_url,
    } = context.propsValue;

    try {
      // First, make the translation request
      const translateResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.heygen.com/v2/video_translate',
        headers: {
          'x-api-key': context.auth as string,
          'Content-Type': 'application/json',
        },
        body: {
          video_url,
          output_language,
          title: title || 'Translated Video',
          translate_audio_only,
          speaker_num,
          callback_id,
          enable_dynamic_duration,
          brand_voice_id,
          callback_url,
        },
      });

      const videoTranslateId = translateResponse.body.data.video_translate_id;

      // Poll for the translation status
      let status = 'pending';
      let translatedVideoUrl = null;
      let errorMessage = null;

      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks

        const statusResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.heygen.com/v2/video_translate/${videoTranslateId}`,
          headers: {
            'x-api-key': context.auth as string,
            'Content-Type': 'application/json',
          },
        });

        const responseData = statusResponse.body.data;
        status = responseData.status;
        translatedVideoUrl = responseData.url;
        errorMessage = responseData.message;

        if (status === 'failed') {
          throw new Error(`Translation failed: ${errorMessage}`);
        }
      }

      return {
        video_translate_id: videoTranslateId,
        status,
        url: translatedVideoUrl,
        message: errorMessage,
      };
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.body?.code === 400599) {
        throw new Error('This feature requires a HeyGen Team plan or higher subscription. Please upgrade your plan to use video translation.');
      }
      throw error;
    }
  },
});
