import { apolloAuth } from '../auth';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const enrichCompany = createAction({
  name: 'enrichCompany',
  description: '',
  audience: 'both',
  aiMetadata: {
    description: 'Look up and enrich a single company in the Apollo database by its web domain, returning the organization profile. Use when you have a company domain and need firmographic details. Read-only and idempotent; an optional project-store cache may return a previously fetched result for the same domain.',
    idempotent: true,
  },
  displayName: 'Enrich Company',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: '',
      required: true,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: true,
    }),
  },
  auth: apolloAuth,
  async run({ propsValue, auth, store }) {
    if (propsValue.cacheResponse) {
      const cachedResult = await store.get(
        `_apollo_org_${propsValue.domain}`,
        StoreScope.PROJECT
      );
      if (cachedResult) {
        return cachedResult;
      }
    }
    const result = await httpClient.sendRequest<{
      organization: Record<string, unknown>;
    }>({
      method: HttpMethod.GET,
      url: `https://api.apollo.io/v1/organizations/enrich?domain=${propsValue.domain}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${auth.secret_text}`,
      },
    });
    const resultOrg = result.body.organization || {};
    if (propsValue.cacheResponse) {
      await store.put(
        `_apollo_org_${propsValue.domain}`,
        resultOrg,
        StoreScope.PROJECT
      );
    }
    return resultOrg;
  },
});
