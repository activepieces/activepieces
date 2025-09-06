import { createAction, Property } from '@activepieces/pieces-framework';

export const voiceChange = createAction({
  name: 'voiceChange',
  displayName: 'Voice Change',
  description: 'Transform any voice recording with a new voice.',
  props: {},
  async run() {
    // Action logic here
  },
});
