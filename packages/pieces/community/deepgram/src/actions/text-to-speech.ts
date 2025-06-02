import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const textToSpeechAction = createAction({
  auth: deepgramAuth,
  name: 'text_to_speech',
  displayName: 'Text to Speech',
  description: 'Converts text to audio file',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'Text to convert to speech (5000 character limit)'
    }),
    voice: Property.StaticDropdown({
      displayName: 'Voice',
      required: true,
      options: {
        options: [
          { label: 'Aurora (Female)', value: 'aura-asteria-en' },
          { label: 'Orion (Male)', value: 'aura-orion-en' },
          { label: 'Stella (Female)', value: 'aura-stella-en' },
          { label: 'Athena (Female)', value: 'aura-athena-en' }
        ],
      },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      required: false,
      defaultValue: 1.0,
      description: 'Speed factor (0.25 to 4.0)'
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' }
        ],
      },
      defaultValue: 'mp3'
    })
  },
  async run(context) {
    const { text, voice, speed, format = 'mp3' } = context.propsValue;
    const client = createDeepgramClient(context.auth);
    
    const response = await client.post('/speak', {
      body: { text },
      queryParams: {
        model: voice,
        ...(speed && { speed: speed.toString() }),
        encoding: format
      },
      responseType: 'arraybuffer'
    });
    
    return {
      audio: response.body,
      mimeType: `audio/${format}`,
      voice,
      textLength: text.length
    };
  },
});