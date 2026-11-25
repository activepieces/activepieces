import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const getCrawlContentAction = createAction({
  auth: zenrowsAuth,
  name: "get_crawl_content",
  classification: "READ",
  displayName: "Get Crawl Page",
  description: "Get the HTML of one page a crawl fetched.",
  audience: 'both',
  aiMetadata: {
    description: "Returns the HTML of one page a crawl with an output format fetched. Take Content ID from the result's content_url. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    crawl_id: Property.ShortText({ displayName: "Crawl ID", description: "The crawl's ID, as Start Crawl returned it (crawl_id).", required: true }),
    content_id: Property.ShortText({ displayName: "Content ID", description: "From the result's content_url.", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://api.zenrows.com/v1","path":"/crawls/{crawl_id}/contents/{content_id}","key":"header","query":[]}, values: propsValue, files });
  },
});
