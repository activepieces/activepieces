import { createAction, Property } from '@activepieces/pieces-framework';

export const generateCreatorDescription = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateCreatorDescription',
  displayName: 'Generate Creator Description',
  description: 'Generate or rewrite a description for the video using AI.',
  props: {},
  async run() {
    // Action logic here
  },
});
