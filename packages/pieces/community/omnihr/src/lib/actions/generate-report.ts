import { createAction, Property } from '@activepieces/pieces-framework';

export const generateReport = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'generateReport',
  displayName: 'Generate Report',
  description: 'Generate Custom Report',
  props: {},
  async run() {
    // Action logic here
  },
});
