import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const createTranscription = createAction({
  auth: deepgramAuth,
  name: 'create-transcription',
  displayName: 'Create Transcription (Callback)',
  description: 'Creates a transcription using a callback URL for asynchronous processing',
  props: {
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Publicly accessible URL of the audio file to transcribe',
      required: true,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL where Deepgram will send the transcription results when processing is complete',
      required: true,
    }),
    callback_method: Property.StaticDropdown({
      displayName: 'Callback Method',
      description: 'HTTP method for the callback request',
      required: false,
      defaultValue: 'POST',
      options: {
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model to use for transcription',
      required: false,
      defaultValue: 'nova-2',
      options: {
        options: [
          { label: 'Nova-2 (Latest)', value: 'nova-2' },
          { label: 'Nova', value: 'nova' },
          { label: 'Enhanced', value: 'enhanced' },
          { label: 'Base', value: 'base' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'The language of the audio content',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Korean', value: 'ko' },
          { label: 'Chinese (Mandarin)', value: 'zh' },
          { label: 'Russian', value: 'ru' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Hindi', value: 'hi' },
        ],
      },
    }),
    punctuate: Property.Checkbox({
      displayName: 'Add Punctuation',
      description: 'Add punctuation and capitalization to the transcript',
      required: false,
      defaultValue: true,
    }),
    diarize: Property.Checkbox({
      displayName: 'Speaker Diarization',
      description: 'Recognize speaker changes and assign speaker numbers',
      required: false,
      defaultValue: false,
    }),
    smart_format: Property.Checkbox({
      displayName: 'Smart Formatting',
      description: 'Apply additional formatting to improve transcript readability',
      required: false,
      defaultValue: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Label your request for identification during usage reporting (comma-separated)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDeepgramClient(auth);
    
    const queryParams: Record<string, string> = {
      callback: propsValue.callback_url,
    };
    
    if (propsValue.callback_method) {
      queryParams.callback_method = propsValue.callback_method;
    }
    if (propsValue.model) {
      queryParams.model = propsValue.model;
    }
    if (propsValue.language) {
      queryParams.language = propsValue.language;
    }
    if (propsValue.punctuate) {
      queryParams.punctuate = 'true';
    }
    if (propsValue.diarize) {
      queryParams.diarize = 'true';
    }
    if (propsValue.smart_format) {
      queryParams.smart_format = 'true';
    }
    if (propsValue.tags) {
      // Split tags by comma and add each one
      const tags = propsValue.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      tags.forEach(tag => {
        queryParams[`tag`] = tag;
      });
    }

    try {
      const response = await client.post('/listen', {
        body: {
          url: propsValue.audio_url,
        },
        queryParams,
      });

      const result = response.body as any;

      return {
        request_id: result.request_id || result.metadata?.request_id,
        callback_url: propsValue.callback_url,
        callback_method: propsValue.callback_method,
        status: 'submitted',
        message: 'Transcription request submitted successfully. Results will be sent to the callback URL when ready.',
        metadata: result.metadata || result,
      };
    } catch (error) {
      throw new Error(`Failed to submit transcription request: ${error}`);
    }
  },
});
