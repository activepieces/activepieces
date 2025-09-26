import { createAction, Property } from '@activepieces/pieces-framework';

export const getWorksheetById = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getWorksheetById',
  displayName: 'Get Worksheet by ID',
  description: '	Retrieve metadata of a worksheet by its ID.',
  props: {},
  async run() {
    // Action logic here
  },
});
