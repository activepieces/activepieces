import { createAction, Property } from '@activepieces/pieces-framework';

export const getExtractionResults = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getExtractionResults',
  displayName: 'Get Extraction Results',
  description: 'Fetches successful data from extraction.',
  props: {},
  async run() {
    // Action logic here
  },
});
