import { createAction } from '@activepieces/pieces-framework';
import { browserlessAuth } from '../common';

export const scrapeUrl = createAction({
  auth: browserlessAuth,
  name: 'scrapeUrl',
  displayName: 'Scrape URL',
  description: 'Scrape content from a page.',
  props: {},
  async run() {
    // Action logic here
  },
});
