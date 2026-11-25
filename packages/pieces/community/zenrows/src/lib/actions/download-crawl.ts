import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const downloadCrawlAction = createAction({
  auth: zenrowsAuth,
  name: "download_crawl",
  classification: "READ",
  displayName: "Download Crawl Results",
  description: "Get every result of a crawl as a list, one item per URL.",
  audience: 'both',
  aiMetadata: {
    description: "Returns every result of a crawl as a list, one object per URL (with content_status and the HTML in content when the crawl has an output format). Use it once the crawl has ended; Get Crawl pages through the same results. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    crawl_id: Property.ShortText({ displayName: "Crawl ID", description: "The crawl's ID, as Start Crawl returned it (crawl_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://api.zenrows.com/v1","path":"/crawls/{crawl_id}/download","key":"header","lines":true}, values: propsValue, files });
  },
});
