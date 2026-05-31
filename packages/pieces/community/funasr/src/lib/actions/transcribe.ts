import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { funasrAuth } from '../auth';
import FormData from 'form-data';
import mime from 'mime-types';

export const transcribeAction = createAction({
  name: 'transcribe_audio',
  displayName: 'Transcribe Audio',
  description: 'Transcribe audio to text using FunASR',
  auth: funasrAuth,
  props: {
    audio: Property.File({
      displayName: 'Audio',
      required: true,
      description: 'Audio file to transcribe',
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The model to use for transcription (e.g. "funasr", "paraformer"). Leave empty for default.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code (e.g. "en", "zh", "ja"). Leave empty for auto-detection.',
      required: false,
    }),
  },
  run: async (context) => {
    const baseUrl = context.auth.props.base_url as string;
    const apiKey = context.auth.props.api_key as string | undefined;
    const fileData = context.propsValue.audio;

    const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');

    const form = new FormData();
    form.append('file', fileData.data, {
      filename: fileData.filename,
      contentType: mimeType as string,
    });

    if (context.propsValue.model) {
      form.append('model', context.propsValue.model);
    }
    if (context.propsValue.language) {
      form.append('language', context.propsValue.language);
    }

    const headers: Record<string, string> = {
      ...form.getHeaders(),
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl.replace(/\/+$/, '')}/v1/audio/transcriptions`,
      body: form,
      headers,
    };

    try {
      const response = await httpClient.sendRequest<Record<string, unknown>>(request);
      const body = response.body;
      const transcriptionText = typeof body['text'] === 'string' ? body['text'] : JSON.stringify(body);
      return {
        text: transcriptionText,
      };
    } catch (e) {
      throw new Error(`FunASR transcription failed: ${e}`);
    }
  },
});
