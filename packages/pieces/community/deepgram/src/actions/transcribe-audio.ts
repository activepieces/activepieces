import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const transcribeAudioAction = createAction({
  auth: deepgramAuth,
  name: 'transcribe_audio',
  displayName: 'Transcribe Audio',
  description: 'Transcribes audio files using Deepgram\'s API',
  props: {
    audioFile: Property.File({
      displayName: 'Audio File',
      required: true,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
        ],
      },
    }),
  },
  async run(context) {
    const { audioFile, language = 'en' } = context.propsValue;
    const client = createDeepgramClient(context.auth);
    
    const response = await client.post('/listen', {
      body: audioFile.data,
      headers: {
        'Content-Type': 'audio/*',
      },
      queryParams: {
        language,
      }
    });
    
    return response.body.results.transcript;
  },
});