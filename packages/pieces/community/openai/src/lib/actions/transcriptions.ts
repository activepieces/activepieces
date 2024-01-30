import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { openaiAuth } from '../..';
import FormData from 'form-data';
import mime from 'mime-types';
import { Languages } from '../common/common';
import OpenAI from 'openai';
import { Uploadable, toFile } from 'openai/uploads';
import { Readable } from 'stream';

export const transcribeAction = createAction({
  name: 'transcribe',
  displayName: 'Transcribe Audio',
  description: 'Transcribe audio to text using whisper-1 model',
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
    const { auth } = context;
    let language = context.propsValue.language;
    // if language is not in languages list, default to english
    if (!Languages.some((l) => l.value === language)) {
      language = 'en';
    }

    try {
      const openai = new OpenAI({
        apiKey: auth as string,
      });

      const stream = Readable.from(fileData.data);
      (stream as any).path = 'audio.m4a'
      const response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: stream as Readable & { path: string },
        language
      });

      return response;
    } catch (e) {
      throw new Error(`Error while excution:\n${e}`);
    }

    const form = new FormData();
    form.append('file', fileData.data, {
      filename: fileData.filename,
      contentType: mimeType as string,
    });
    form.append('model', 'whisper-1');
    form.append('language', language);

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.openai.com/v1/audio/transcriptions`,
      body: form,
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${context.auth}`,
      },
    };
    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (e) {
      throw new Error(`Error while excution:\n${e}`);
    }
  },
});
