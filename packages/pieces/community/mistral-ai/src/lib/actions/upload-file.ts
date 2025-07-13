import { createAction, Property } from '@activepieces/pieces-framework';

export const uploadFile = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'uploadFile',
  displayName: 'Upload File',
  description: 'Upload a file to Mistral AI (e.g., for fine-tuning or context storage).',
  props: {},
  async run() {
    // Action logic here
  },
});
