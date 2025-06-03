import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const textToSpeech = createAction({
  auth: deepgramAuth,
  name: 'text-to-speech',
  displayName: 'Text to Speech',
  description: 'Convert text to natural-sounding speech using Deepgram\'s TTS API',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to be converted to speech',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Voice Model',
      description: 'AI voice model to use for speech synthesis',
      required: false,
      defaultValue: 'aura-asteria-en',
      options: {
        options: [
          { label: 'Aura Asteria (English)', value: 'aura-asteria-en' },
          { label: 'Aura Luna (English)', value: 'aura-luna-en' },
          { label: 'Aura Stella (English)', value: 'aura-stella-en' },
          { label: 'Aura Athena (English)', value: 'aura-athena-en' },
          { label: 'Aura Hera (English)', value: 'aura-hera-en' },
          { label: 'Aura Orion (English)', value: 'aura-orion-en' },
          { label: 'Aura Arcas (English)', value: 'aura-arcas-en' },
          { label: 'Aura Perseus (English)', value: 'aura-perseus-en' },
          { label: 'Aura Angus (English)', value: 'aura-angus-en' },
          { label: 'Aura Orpheus (English)', value: 'aura-orpheus-en' },
          { label: 'Aura Helios (English)', value: 'aura-helios-en' },
          { label: 'Aura Zeus (English)', value: 'aura-zeus-en' },
        ],
      },
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Audio Encoding',
      description: 'Output audio encoding format',
      required: false,
      defaultValue: 'mp3',
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
          { label: 'FLAC', value: 'flac' },
          { label: 'AAC', value: 'aac' },
          { label: 'OGG', value: 'ogg' },
          { label: 'PCM', value: 'pcm' },
          { label: 'Opus', value: 'opus' },
        ],
      },
    }),
    container: Property.StaticDropdown({
      displayName: 'Container Format',
      description: 'File format wrapper for the output audio',
      required: false,
      defaultValue: 'wav',
      options: {
        options: [
          { label: 'WAV', value: 'wav' },
          { label: 'OGG', value: 'ogg' },
          { label: 'None', value: 'none' },
        ],
      },
    }),
    sample_rate: Property.Number({
      displayName: 'Sample Rate',
      description: 'Sample rate for the output audio (Hz). Common values: 8000, 16000, 22050, 44100, 48000',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const client = createDeepgramClient(auth);

    const queryParams: Record<string, string> = {};
    
    if (propsValue.model) {
      queryParams.model = propsValue.model;
    }
    if (propsValue.encoding) {
      queryParams.encoding = propsValue.encoding;
    }
    if (propsValue.container) {
      queryParams.container = propsValue.container;
    }
    if (propsValue.sample_rate) {
      queryParams.sample_rate = propsValue.sample_rate.toString();
    }

    try {
      const response = await client.post('/speak', {
        body: {
          text: propsValue.text,
        },
        queryParams,
        responseType: 'arraybuffer',
      });

      // The response body should be audio data
      const audioData = response.body;
      
      // Determine file extension based on encoding and container
      let fileExtension = 'wav'; // default
      if (propsValue.container === 'ogg') {
        fileExtension = 'ogg';
      } else if (propsValue.encoding === 'mp3') {
        fileExtension = 'mp3';
      } else if (propsValue.encoding === 'flac') {
        fileExtension = 'flac';
      } else if (propsValue.encoding === 'aac') {
        fileExtension = 'aac';
      }

      // Save the audio file
      const fileName = `speech.${fileExtension}`;
      return await files.write({
        fileName: fileName,
        data: Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData as ArrayBuffer),
      });
    } catch (error) {
      throw new Error(`Failed to convert text to speech: ${error}`);
    }
  },
});
