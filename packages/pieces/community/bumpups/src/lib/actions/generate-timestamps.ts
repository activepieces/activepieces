import { createAction, Property } from '@activepieces/pieces-framework';

export const generateTimestamps = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateTimestamps',
  displayName: 'Generate Timestamps',
  description: 'Generate timestamped sections for the video (e.g. by detecting chapters/topics).',
  props: {},
  async run() {
    // Action logic here
  },
});
