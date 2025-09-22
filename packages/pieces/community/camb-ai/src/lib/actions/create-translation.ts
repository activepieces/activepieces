import { createAction, Property } from '@activepieces/pieces-framework';

export const createTranslation = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createTranslation',
  displayName: 'Create Translation',
  description: 'Translate text from a source language to a target language.',
  props: {},
  async run() {
    // Action logic here
  },
});
