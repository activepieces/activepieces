import { apolloAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const enrichCompany = createAction({
  name: 'enrichCompany',
  description: '',
  displayName: 'Enrich Company',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: '',
      required: true,
    }),
  },
  auth: apolloAuth,
  async run({ propsValue, auth, store }) {
    const cachedResult = await store.get(`_apollo_org_${propsValue.domain}`)
    if (cachedResult) {
      return cachedResult;
    }
    const result = await httpClient.sendRequest<{ organization: Record<string, unknown> }>({
      method: HttpMethod.GET,
      url: `https://api.apollo.io/v1/organizations/enrich?domain=${propsValue.domain}&api_key=${auth}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    await store.put(`_apollo_org_${propsValue.domain}`, result.body.organization);
    return result.body.organization;
  },
});
