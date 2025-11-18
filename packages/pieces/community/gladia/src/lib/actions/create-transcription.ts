import {
  createAction,
  Property,
  ActionContext,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gladiaAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const createTranscription = createAction({
  auth: gladiaAuth,
  name: 'createTranscription',
  displayName: 'Create Transcription',
  description:
    'Initiate a pre-recorded transcription job from an audio or video URL',
  props: {
    audio_url: Property.LongText({
      displayName: 'Audio URL',
      description: 'URL to a Gladia file or to an external audio or video file',
      required: true,
    }),
    language_config: Property.Object({
      displayName: 'Language Config',
      description: 'Specify the language configuration (optional)',
      required: false,
    }),
    subtitles: Property.Checkbox({
      displayName: 'Enable Subtitles',
      description: 'Enable subtitles generation for this transcription',
      required: false,
      defaultValue: false,
    }),
    diarization: Property.Checkbox({
      displayName: 'Enable Diarization',
      description: 'Enable speaker recognition (diarization) for this audio',
      required: false,
      defaultValue: false,
    }),
    translation: Property.Checkbox({
      displayName: 'Enable Translation',
      description: 'Enable translation for this audio',
      required: false,
      defaultValue: false,
    }),
    sentiment_analysis: Property.Checkbox({
      displayName: 'Enable Sentiment Analysis',
      description: 'Enable sentiment analysis for this audio',
      required: false,
      defaultValue: false,
    }),
    custom_metadata: Property.Object({
      displayName: 'Custom Metadata',
      description: 'Custom metadata to attach to this transcription',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const {
      audio_url,
      language_config,
      subtitles,
      diarization,
      translation,
      sentiment_analysis,
      custom_metadata,
    } = context.propsValue;

    const body: any = {
      audio_url,
    };
    if (language_config) {
      body.language_config = language_config;
    }
    if (subtitles) {
      body['subtitles'] = subtitles;
    }
    if (diarization) {
      body['diarization'] = diarization;
    }
    if (translation) {
      body['translation'] = translation;
    }
    if (sentiment_analysis) {
      body['sentiment_analysis'] = sentiment_analysis;
    }
    if (custom_metadata) {
      body['custom_metadata'] = custom_metadata;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/pre-recorded',
      body
    );
    const transcription = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/pre-recorded/${response.id}`
    );
    return transcription;
  },
});
