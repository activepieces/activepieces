import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const getCrawlAction = createAction({
  auth: zenrowsAuth,
  name: "get_crawl",
  classification: "READ",
  displayName: "Get Crawl",
  description: "Read a crawl's status and one page of the URLs it found.",
  audience: 'both',
  aiMetadata: {
    description: "Reads a crawl's status, coverage and one page of results. While it runs, pass next_cursor back as Cursor to get only new URLs; it is null once the crawl has ended and everything is read. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    cursor: Property.ShortText({ displayName: "Cursor", description: "The next_cursor from the previous read. Omit it to start from the first result.", required: false }),
    limit: Property.Number({ displayName: "Limit", description: "How many results to return.", required: false, defaultValue: 1000 }),
    crawl_id: Property.ShortText({ displayName: "Crawl ID", description: "The crawl's ID, as Start Crawl returned it (crawl_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://api.zenrows.com/v1","path":"/crawls/{crawl_id}","key":"header","query":["cursor","limit"]}, values: propsValue, files });
  },
});
