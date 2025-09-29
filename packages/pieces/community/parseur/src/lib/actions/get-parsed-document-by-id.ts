import { createAction, Property } from '@activepieces/pieces-framework';

export const getParsedDocumentById = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getParsedDocumentById',
  displayName: 'Get Parsed Document by ID',
  description: 'Fetch parsed JSON / structured output for a given document ID',
  props: {},
  async run() {
    // Action logic here
  },
});
