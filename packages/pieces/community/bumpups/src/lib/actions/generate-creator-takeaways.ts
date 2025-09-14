import { createAction, Property } from '@activepieces/pieces-framework';

export const generateCreatorTakeaways = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateCreatorTakeaways',
  displayName: 'Generate Creator Takeaways',
  description: 'Extract key takeaways (bullet points or summary) from the video.',
  props: {},
  async run() {
    // Action logic here
  },
});
