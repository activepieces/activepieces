import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const transcribeAudio = createAction({
  auth: deepgramAuth,
  name: 'transcribe-audio',
  displayName: 'Transcribe Audio',
  description: 'Transcribe audio files using Deepgram\'s speech-to-text API',
  props: {
    audio_file: Property.File({
      displayName: 'Audio File',
      description: 'The audio file to transcribe (supports various formats like MP3, WAV, M4A, etc.)',
      required: true,
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
    detect_language: Property.Checkbox({
      displayName: 'Detect Language',
      description: 'Automatically detect the dominant language in the audio',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDeepgramClient(auth);
    const audioFile = propsValue.audio_file;
    
    const queryParams: Record<string, string> = {};
    
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
    if (propsValue.detect_language) {
      queryParams.detect_language = 'true';
    }

    try {
      const response = await client.post('/listen', {
        body: audioFile.data,
        headers: {
          'Content-Type': 'audio/*',
        },
        queryParams,
      });

      return response.body;
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error}`);
    }
  },
});
