import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const getExtractDomainStatusAction = createAction({
  auth: zenrowsAuth,
  name: "get_extract_domain_status",
  classification: "READ",
  displayName: "Get Extract Domain Status",
  description: "Check how far a domain's preparation for Extract has got.",
  audience: 'both',
  aiMetadata: {
    description: "Reads the preparation status of a domain submitted with Request Extract Domain. Branch on status: preparing, ready or failed. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({ displayName: "Domain", description: "The domain, without scheme.", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://api.zenrows.com/v1","path":"/extract/prepared-domains/{domain}","key":"header"}, values: propsValue, files });
  },
});
