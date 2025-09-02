import { createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common';

export const runBqlQuery = createAction({
  auth: browserlessAuth,
  name: 'runBqlQuery',
  displayName: 'Run BQL Query',
  description: 'Runs Browser Query Lang(BQL).',
  props: {},
  async run() {
    // Action logic here
  },
});
