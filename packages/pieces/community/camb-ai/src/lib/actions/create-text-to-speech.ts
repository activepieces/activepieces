import { createAction, Property } from '@activepieces/pieces-framework';

export const createText-to-speech = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createText-to-speech',
  displayName: 'Create Text-to-Speech',
  description: 'Convert text into speech using specified voice, language, gender, age group.',
  props: {},
  async run() {
    // Action logic here
  },
});
