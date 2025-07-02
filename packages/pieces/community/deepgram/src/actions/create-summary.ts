import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { BASE_URL, LANG_OPTIONS, MODEL_OPTIONS } from '../common/constants';
import mime from 'mime-types';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createSummaryAction = createAction({
  auth: deepgramAuth,
  name: 'create_summary',
  displayName: 'Create Summary',
  description: 'Produces a summary of the content from an audio file.',
  props: {
    audioFile: Property.File({
      displayName: 'Audio File',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      options: {
        options: MODEL_OPTIONS,
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
        Authorization: `Token ${context.auth}`,
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
