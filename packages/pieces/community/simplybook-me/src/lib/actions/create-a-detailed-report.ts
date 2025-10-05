import { createAction, Property } from '@activepieces/pieces-framework';

export const createADetailedReport = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createADetailedReport',
  displayName: 'Create a Detailed Report',
  description: 'Generate a detailed report (metrics, bookings, revenue).',
  props: {},
  async run() {
    // Action logic here
  },
});
