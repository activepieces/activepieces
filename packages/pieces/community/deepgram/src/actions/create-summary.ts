import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { BASE_URL, LANG_OPTIONS } from '../common/constants';
import { deepgramModels } from '../common/models';
import mime from 'mime-types';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createSummaryAction = createAction({
  auth: deepgramAuth,
  name: 'create_summary',
  displayName: 'Create Summary',
  description: 'Produces a summary of the content from an audio file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads an audio file to Deepgram and returns an AI-generated summary of its spoken content (summarize v2), synchronously. Pick this over Create Transcription when you need a condensed overview rather than the full text; by default it falls back to the full transcript if no summary is available. Re-running re-processes the audio and incurs another billed request, though it creates no persistent resource.',
    idempotent: false,
  },
  props: {
    audioFile: Property.File({
      displayName: 'Audio File',
      required: true,
    }),
    model: Property.Dropdown({
      auth: deepgramAuth,
      displayName: 'Model',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const options = await deepgramModels.fetchSttModelOptions({
            apiKey: auth.secret_text,
          });
          return { disabled: false, options };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder:
              "Couldn't load models, check your API key or try again.",
          };
        }
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      description: 'en',
      options: {
        disabled: false,
        options: LANG_OPTIONS,
      },
    }),
    fallbackToTranscript: Property.Checkbox({
      displayName: 'Fallback to Full Transcript',
      description: 'Return full transcript if summary is not available.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      audioFile,
      model = 'nova',
      fallbackToTranscript,
      language,
    } = context.propsValue;
    const mimeType = mime.lookup(audioFile.extension || '') || 'audio/wav';

    const response = await httpClient.sendRequest({
      url: BASE_URL + '/listen',
      method: HttpMethod.POST,
      headers: {
        Authorization: `Token ${context.auth.secret_text}`,
        'Content-Type': mimeType,
      },
      body: audioFile.data,
      responseType: 'json',
      queryParams: {
        model,
        summarize: 'v2',
        language: language || 'en',
      },
    });

    if (response.body.results.summary) {
      return response.body.results.summary;
    }

    if (
      fallbackToTranscript &&
      response.body.results.channels?.[0]?.alternatives?.[0]?.transcript
    ) {
      return response.body.results.channels[0].alternatives[0].transcript;
    }

    throw new Error('No summary or transcript available');
  },
});
