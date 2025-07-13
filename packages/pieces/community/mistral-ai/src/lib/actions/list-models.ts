import { createAction, Property } from '@activepieces/pieces-framework';

export const listModels = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'listModels',
  displayName: 'List Models',
  description: 'Retrieve a list of available Mistral models to use for completions or embeds.',
  props: {},
  async run() {
    // Action logic here
  },
});
