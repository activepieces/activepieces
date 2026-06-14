import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { BASE_URL, LANG_OPTIONS } from '../common/constants';
import { deepgramModels } from '../common/models';
import mime from 'mime-types';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createTranscriptionCallbackAction = createAction({
  auth: deepgramAuth,
  name: 'create_transcription_callback',
  displayName: 'Create Transcription (Callback)',
  description: 'Creates a transcription using a callback URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Submits an audio file to Deepgram for asynchronous speech-to-text: the action returns only a request ID immediately, and the finished transcript is delivered later to the callback URL you provide. Pick this for long audio or when a webhook endpoint will consume the result; it does not return the transcript itself. Each run submits a new billed transcription job, so it is not idempotent.',
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
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL to receive the transcription when ready.',
      required: true,
    }),
  },
  async run(context) {
    const {
      audioFile,
      model = 'nova',
      callbackUrl,
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
        callback: callbackUrl,
        language: language || 'en',
      },
    });

    return {
      requestId: response.body.request_id,
      callbackUrl,
      status: 'submitted',
    };
  },
});
