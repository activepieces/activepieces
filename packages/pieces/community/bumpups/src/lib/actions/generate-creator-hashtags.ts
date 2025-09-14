import { createAction, Property } from '@activepieces/pieces-framework';

export const generateCreatorHashtags = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateCreatorHashtags',
  displayName: 'Generate Creator Hashtags',
  description: 'Produce hashtags suitable for a video based on its content.',
  props: {},
  async run() {
    // Action logic here
  },
});
