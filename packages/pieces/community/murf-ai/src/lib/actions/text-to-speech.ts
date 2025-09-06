import { createAction, Property } from '@activepieces/pieces-framework';

export const textToSpeech = createAction({
  name: 'textToSpeech',
  displayName: 'Text to Speech',
  description: 'Converts input text into audio.',
  props: {},
  async run() {
    // Action logic here
  },
});
