import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { openaiAuth } from '../auth';
import FormData from 'form-data';

export const transcribeAction = createAction({
  auth: openaiAuth,
  name: 'transcribe',
  displayName: 'Transcribe Audio',
  description: 'Transcribe audio to text using Whisper.',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
      required: false,
    }),
    audio: Property.File({
      displayName: 'Audio',
      description: 'The audio file to transcribe.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for transcription.',
      required: false,
      defaultValue: 'whisper-1',
      options: {
        options: [{ label: 'whisper-1', value: 'whisper-1' }],
      },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'The language of the audio file.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'An optional text to guide the model.',
      required: false,
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'The format of the transcription.',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
          { label: 'SRT', value: 'srt' },
          { label: 'Verbose JSON', value: 'verbose_json' },
          { label: 'VTT', value: 'vtt' },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The sampling temperature.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { audio, model, language, prompt, response_format, temperature, baseUrl } =
      context.propsValue;

    const form = new FormData();
    form.append('file', audio.data, audio.filename);
    form.append('model', model ?? 'whisper-1');
    if (language) form.append('language', language);
    if (prompt) form.append('prompt', prompt);
    if (response_format) form.append('response_format', response_format);
    if (temperature) form.append('temperature', temperature.toString());

    const headers = {
      Authorization: `Bearer ${context.auth as string}`,
    };

    const baseUrlFromProps = baseUrl || 'https://api.openai.com/v1';
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrlFromProps}/audio/transcriptions`,
      body: form,
      headers: {
        ...form.getHeaders(),
        ...headers,
      },
    };
    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (e) {
      throw new Error(`Error while execution:\n${e}`);
    }
  },
});
