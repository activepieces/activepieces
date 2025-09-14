import { createAction, Property } from '@activepieces/pieces-framework';

export const generateCreatorTitles = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateCreatorTitles',
  displayName: 'Generate Creator Titles',
  description: 'Generate several optimized video titles based on a video URL using AI model.',
  props: {},
  async run() {
    // Action logic here
  },
});
