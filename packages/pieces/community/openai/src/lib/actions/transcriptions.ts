import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { openaiAuth } from '../auth';
import FormData from 'form-data';
import mime from 'mime-types';
import { Languages, baseUrl } from '../common/common';

export const transcribeAction = createAction({
  audience: 'both',
  name: 'transcribe',
  displayName: 'Transcribe Audio',
  description: 'Transcribe audio to text using whisper-1 model',
  aiMetadata: { description: 'Transcribes an uploaded audio file to text with the whisper-1 model, keeping the words in the language that was spoken, with an optional language hint (defaulting to English, and silently falling back to English when an unsupported code is given) that improves accuracy. Choose the sibling translate action instead whenever the output must be English no matter what language was spoken, and text_to_speech for the opposite direction. Requires an audio file; not idempotent: each call re-runs the model and the wording can vary slightly.', idempotent: false },
  auth: openaiAuth,
  props: {
    audio: Property.File({
      displayName: 'Audio',
      required: true,
      description: 'Audio file to transcribe',
    }),
    language: Property.StaticDropdown({
      displayName: 'Language of the Audio',
      description: 'Language of the audio file the default is en (English).',
      required: false,
      options: {
        options: Languages,
      },
      defaultValue: 'en',
    }),
  },
  run: async (context) => {
    const fileData = context.propsValue.audio;
    const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');
    let language = context.propsValue.language;
    // if language is not in languages list, default to english
    if (!Languages.some((l) => l.value === language)) {
      language = 'en';
    }

    const form = new FormData();
    form.append('file', fileData.data, {
      filename: fileData.filename,
      contentType: mimeType as string,
    });
    form.append('model', 'whisper-1');
    form.append('language', language);

    const headers = {
      Authorization: `Bearer ${context.auth.secret_text}`,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/audio/transcriptions`,
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
