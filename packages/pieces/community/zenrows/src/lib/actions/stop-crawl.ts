import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const stopCrawlAction = createAction({
  auth: zenrowsAuth,
  name: "stop_crawl",
  classification: "DESTRUCTIVE",
  displayName: "Stop Crawl",
  description: "Stop a running crawl. Pages already being fetched finish and are kept.",
  audience: 'both',
  aiMetadata: {
    description: "Stops a running crawl: no new page is fetched, pages in progress finish and are billed. Read it afterwards with Get Crawl for the final results. Stopping a crawl that already ended returns its final state.",
    idempotent: false,
  },
  props: {
    crawl_id: Property.ShortText({ displayName: "Crawl ID", description: "The crawl's ID, as Start Crawl returned it (crawl_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"POST","server":"https://api.zenrows.com/v1","path":"/crawls/{crawl_id}/stop","key":"header"}, values: propsValue, files });
  },
});
