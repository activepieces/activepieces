import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';

export const textToSpeech = createAction({
  name: 'text_to_speech',
  displayName: 'Text to Speech',
  description: 'Converts input text into audio using Murf AI',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to convert to speech',
      required: true,
    }),
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'The ID of the voice to use',
      required: true,
    }),
    format: Property.Dropdown({
      displayName: 'Audio Format',
      description: 'The format of the output audio file',
      required: true,
      defaultValue: 'mp3',
      options: {
        options: [
          { label: 'MP3', value: 'mp3' },
          { label: 'WAV', value: 'wav' },
        ],
      },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: 'The speed of the speech (0.5 to 2.0)',
      required: false,
      defaultValue: 1.0,
    }),
    pitch: Property.Number({
      displayName: 'Pitch',
      description: 'The pitch of the speech (-1.0 to 1.0)',
      required: false,
      defaultValue: 0.0,
    }),
    pause: Property.Number({
      displayName: 'Pause',
      description: 'The pause between sentences in milliseconds',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { text, voice_id, format, speed, pitch, pause } = context.propsValue;

    const response = await makeRequest({
      method: HttpMethod.POST,
      apiKey,
      baseUrl,
      path: '/speech/generate',
      body: {
        text,
        voice_id,
        format,
        speed,
        pitch,
        pause,
      },
    });

    return response;
  },
});