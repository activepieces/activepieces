import { createAction } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const listExtractDomainsAction = createAction({
  auth: zenrowsAuth,
  name: "list_extract_domains",
  classification: "SEARCH",
  displayName: "List Extract Domains",
  description: "List the domains Extract serves publicly.",
  audience: 'both',
  aiMetadata: {
    description: "Lists domains that Extract announces as ready. The list is not complete: a domain missing from it may still work, so try Extract Structured Data and branch on REQS007 instead of relying on it. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {},
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://api.zenrows.com/v1","path":"/extract/domains","key":"header"}, values: propsValue, files });
  },
});
