import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf, isRecord } from '../common/client';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloRequests } from '../common/requests';

export const enrichCompany = createAction({
  name: 'enrichCompany',
  classification: 'READ',
  displayName: 'Enrich Company',
  description: 'Get firmographic details for a company from its web domain. Uses 1 Apollo credit.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up one company in the Apollo database by web domain and returns its organization profile, or an empty object when there is no match. Uses 1 Apollo credit. With Cache Response on, a previously found company is returned from the project store without a new request.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The company web domain, without "www." or "@", e.g. apollo.io.',
      required: true,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store a found company in the project store and reuse it for the same domain. Companies that were not found are never cached.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: apolloOutputSchemas.rawOrganization,
  auth: apolloAuth,
  async run({ propsValue, auth, store }) {
    const domain = String(propsValue.domain ?? '').trim();
    if (domain === '') {
      throw new Error('Domain is required.');
    }
    const cacheKey = `_apollo_org_${domain}`;
    if (propsValue.cacheResponse) {
      const cached = await store.get<unknown>(cacheKey, StoreScope.PROJECT);
      if (isRecord(cached) && Object.keys(cached).length > 0) {
        return cached;
      }
    }
    const response = await apolloRequests.enrichOrganization({ apiKey: apiKeyOf(auth), query: { domain } });
    const organization = isRecord(response['organization']) ? response['organization'] : {};
    if (propsValue.cacheResponse && Object.keys(organization).length > 0) {
      await store.put(cacheKey, organization, StoreScope.PROJECT);
    }
    return organization;
  },
});
