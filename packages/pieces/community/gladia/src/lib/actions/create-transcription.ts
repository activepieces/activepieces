import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gladiaAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { languageDropdownOptions } from '../common/props';

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
    languages: Property.StaticDropdown({
      displayName: 'Language',
      description:
        'Select the language spoken in the audio for better transcription accuracy',
      required: false,
      options: {
        options: languageDropdownOptions,
      },
    }),
    code_switching: Property.Checkbox({
      displayName: 'Enable Code Switching',
      description:
        'Enable code switching to handle multiple languages in the audio',
      required: false,
      defaultValue: false,
    }),

    subtitles: Property.Checkbox({
      displayName: 'Enable Subtitles',
      description: 'Enable subtitles generation for this transcription',
      required: false,
      defaultValue: false,
    }),
    subtitles_format: Property.Dropdown({
      displayName: 'Subtitles Format',
      description: 'Select the subtitle format(s) for transcription output',
      required: false,  
      auth: gladiaAuth,
      refreshers: ['subtitles'],
      options: async ({ subtitles }) => {
        if (!subtitles) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Enable subtitles to select type',
          };
        }
        return {
          disabled: false,
          options: [
            { label: 'SRT', value: 'srt' },
            { label: 'VTT', value: 'vtt' },
          ],
        };
      },
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
    summarization: Property.Checkbox({
      displayName: 'Enable Summarization',
      description: 'Enable summarization for this audio',
      required: false,
      defaultValue: false,
    }),
    summarization_type: Property.Dropdown({
      displayName: 'Summarization Type',
      description: 'Choose the type of summarization to apply. ',
      required: false,
      auth: gladiaAuth,
      refreshers: ['summarization'],
      options: async ({ summarization }) => {
        if (!summarization) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Enable summarization to select type',
          };
        }
        return {
          disabled: false,
          options: [
            { label: 'General', value: 'general' },
            { label: 'Bullet Points', value: 'bullet_points' },
            { label: 'Concise', value: 'concise' },
          ],
        };
      },
    }),
    sentiment_analysis: Property.Checkbox({
      displayName: 'Enable Sentiment Analysis',
      description: 'Enable sentiment analysis for this audio',
      required: false,
      defaultValue: false,
    }),
    sentences: Property.Checkbox({
      displayName: 'Enable Sentences',
      description: 'Enable sentence detection for this audio',
      required: false,
      defaultValue: false,
    }),
    custom_metadata: Property.Object({
      displayName: 'Custom Metadata',
      description: 'Add custom metadata to the transcription job',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const {
      audio_url,
      languages,
      code_switching,
      subtitles,
      subtitles_format,
      diarization,
      translation,
      summarization,
      summarization_type,
      sentiment_analysis,
      sentences,
      custom_metadata,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      audio_url,
      sentences,
    };
    if (languages) {
      body['language_config'] = { language: languages, code_switching };
    }
    if (subtitles) {
      body['subtitles'] = subtitles;
      if (subtitles_format && subtitles_format.length > 0) {
        body['subtitles_config'] = { formats: subtitles_format };
      }
    }
    if (diarization) {
      body['diarization'] = diarization;
    }
    if (translation) {
      body['translation'] = translation;
    }
    if (summarization) {
      body['summarization'] = summarization;
      if (summarization_type) {
        body['summarization_config'] = { type: summarization_type };
      }
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
