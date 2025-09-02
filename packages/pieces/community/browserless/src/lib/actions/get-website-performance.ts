import { createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common';

export const getWebsitePerformance = createAction({
  auth: browserlessAuth,
  name: 'getWebsitePerformance',
  displayName: 'Get Website Performance',
  description: 'Get states on website performance.',
  props: {},
  async run() {
    // Action logic here
  },
});
