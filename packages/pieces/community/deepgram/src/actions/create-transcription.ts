import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { BASE_URL, LANG_OPTIONS, MODEL_OPTIONS } from '../common/constants';
import mime from 'mime-types';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createTranscriptionCallbackAction = createAction({
  auth: deepgramAuth,
  name: 'create_transcription_callback',
  displayName: 'Create Transcription (Callback)',
  description: 'Creates a transcription using a callback URL.',
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
        Authorization: `Token ${context.auth}`,
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
