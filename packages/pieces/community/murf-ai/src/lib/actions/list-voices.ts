import { createAction, Property } from '@activepieces/pieces-framework';

export const listVoices = createAction({
  name: 'listVoices',
  displayName: 'List Voices',
  description: 'Lists all the voices.',
  props: {},
  async run() {
    // Action logic here
  },
});
