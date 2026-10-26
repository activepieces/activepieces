import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { apiverveCommon } from '../common';

export const lookupDnsRecordsAction = createAction({
  auth: apiverveAuth,
  name: 'lookup_dns_records',
  classification: 'READ',
  displayName: 'Look Up DNS Records',
  description: 'Get the DNS records of a domain, such as A, MX, TXT and NS.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the DNS records of one domain (A, AAAA, MX, TXT, NS and more). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain to look up, without https://, for example example.com.',
      required: true,
    }),
  },
  async run(context) {
    return apiverveCommon.callApiverve({
      apiKey: context.auth.secret_text,
      path: '/v1/dnslookup',
      method: HttpMethod.GET,
      query: apiverveCommon.toQuery({ domain: context.propsValue.domain }),
    });
  },
});
