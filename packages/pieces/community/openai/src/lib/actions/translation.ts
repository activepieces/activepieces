import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { openaiAuth } from '../auth';
import FormData from 'form-data';
import mime from 'mime-types';
import { baseUrl } from '../common/common';

export const translateAction = createAction({
  audience: 'both',
  name: 'translate',
  displayName: 'Translate Audio',
  description: 'Translate audio to text using whisper-1 model',
  aiMetadata: { description: 'Turns an uploaded audio file into English text with the whisper-1 model, translating from whatever language was spoken; there is no target-language option, the output is always English. Pick the sibling transcribe action when the transcript must stay in the original language, and note this handles audio input only - it cannot translate a text string. Requires an audio file; not idempotent: each call re-runs the model and the wording can vary slightly.', idempotent: false },
  auth: openaiAuth,
  props: {
    audio: Property.File({
      displayName: 'Audio',
      required: true,
      description: 'Audio file to translate',
    }),
  },
  run: async (context) => {
    const fileData = context.propsValue.audio;
    const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');
    const form = new FormData();
    form.append('file', fileData.data, {
      filename: fileData.filename,
      contentType: mimeType as string,
    });
    form.append('model', 'whisper-1');

    const headers = {
      Authorization: `Bearer ${context.auth.secret_text}`,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/audio/translations`,
      body: form,
      headers: {
        ...form.getHeaders(),
        ...headers,
      },
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
