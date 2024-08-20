import { createAction, Property } from '@activepieces/pieces-framework';

export const textToSpeechAction = createAction({
  name: 'text-to-speech',
  displayName: 'Text to Speech',
  description: 'Converts text into audio.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        disabled: false,
        options: [],
      },
    }),
    voice: Property.StaticDropdown({
      displayName: 'Voice',
      description: 'The voice to generate the audio in.',
      required: false,
      options: {
        disabled: false,
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
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      description: 'The format you want the audio file in.',
      defaultValue: 'mp3',
      options: {
        disabled: false,
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
      },
    }),
  },
  async run(context) {},
});
