import { createAction, Property } from '@activepieces/pieces-framework';
import { AI, aiProps } from '@activepieces/pieces-common';

export const textToSpeech = createAction({
  name: 'textToSpeech',
  displayName: 'Text to Speech',
  description: 'Converts text to speech.',
  props: {
    provider: aiProps('speech').provider,
    model: aiProps('speech').model,
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    voice: Property.Dropdown({
      displayName: 'Voice',
      description: 'The voice to generate the audio in.',
      required: true,
      refreshers: ['provider'],
      defaultValue: 'alloy',
      options: async ({ provider }) => {
        if (provider === 'openai') {
          return {
            options: [
              {
                label: 'alloy',
                value: 'alloy',
              },
              {
                label: 'echo',
                value: 'echo',
              },
              {
                label: 'fable',
                value: 'fable',
              },
              {
                label: 'onyx',
                value: 'onyx',
              },
              {
                label: 'nova',
                value: 'nova',
              },
              {
                label: 'shimmer',
                value: 'shimmer',
              },
            ],
          };
        }
        return {
          disabled: false,
          options: [],
        };
      },
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description:
        'The speed of the audio. Minimum is 0.25 and maximum is 4.00.',
      defaultValue: 1.0,
      required: false,
    }),
    format: Property.Dropdown({
      displayName: 'Output Format',
      required: true,
      description: 'The format you want the audio file in.',
      defaultValue: 'mp3',
      refreshers: ['provider'],
      options: async ({ provider }) => {
        if (provider === 'openai') {
          return {
            options: [
              {
                label: 'mp3',
                value: 'mp3',
              },
              {
                label: 'opus',
                value: 'opus',
              },
              {
                label: 'aac',
                value: 'aac',
              },
              {
                label: 'flac',
                value: 'flac',
              },
            ],
          };
        }
        return {
          disabled: false,
          options: [],
        };
      },
    }),
  },
  async run(context) {
    const ai = AI({
      provider: context.propsValue.provider,
      server: context.server,
    });

    const response = await ai.voice?.createSpeech({
      model: context.propsValue.model,
      input: context.propsValue.text,
      voice: context.propsValue.voice,
      speed: context.propsValue.speed,
      response_format: context.propsValue.format,
    });

    console.log(JSON.stringify(response));

    return context.files.write({
      fileName: 'audio.' + context.propsValue.format,
      data: response.data as Buffer,
    });
  },
});
