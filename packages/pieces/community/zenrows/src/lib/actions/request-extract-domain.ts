import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const requestExtractDomainAction = createAction({
  auth: zenrowsAuth,
  name: "request_extract_domain",
  classification: "WRITE",
  displayName: "Request Extract Domain",
  description: "Ask Zenrows to prepare a domain for Extract. Preparation usually takes minutes.",
  audience: 'both',
  aiMetadata: {
    description: "Submits a domain for Extract to prepare, within a monthly allowance, and returns at once. Use it after Extract Structured Data answers REQS007, then poll Get Extract Domain Status until status is ready. Send 3 to 5 example URLs of the main page type when you can. Submitting a prepared domain returns its current state, so a retry is safe.",
    idempotent: false,
  },
  props: {
    domain: Property.ShortText({ displayName: "Domain", description: "The domain to prepare, without scheme.", required: true }),
    example_urls: Property.Array({ displayName: "Example URLs", description: "1 to 5 page URLs on the domain. At least 3 pages of your main page type (for example product pages) work best; other page types can fill the rest.", required: false }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"POST","server":"https://api.zenrows.com/v1","path":"/extract/prepared-domains","key":"header","body":["domain","example_urls"]}, values: propsValue, files });
  },
});
