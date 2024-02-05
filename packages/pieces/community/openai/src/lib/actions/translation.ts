import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { openaiAuth } from '../..';
import FormData from 'form-data';
import mime from 'mime-types';

export const translateAction = createAction({
  name: 'translate',
  displayName: 'Translate Audio',
  description: 'Translate audio to text using whisper-1 model',
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

    let headers;
    let queryParams;
    if (context.auth.apiVersion) {
        headers = {
            'api-key': context.auth.apiKey
        }
        queryParams = {
            'api-version': context.auth.apiVersion
        }
    }
    else {
        headers = {
            Authorization: `Bearer ${context.auth.apiKey}`
        }
    }

    const baseUrl = context.auth.baseUrl.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/audio/translations`,
      body: form,
      headers: {
        ...form.getHeaders(),
        ...headers,
      },
      queryParams,
    };
    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (e) {
      throw new Error(`Error while excution:\n${e}`);
    }
  },
});
