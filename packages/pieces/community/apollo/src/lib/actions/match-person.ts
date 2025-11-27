import { apolloAuth } from '../../';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';

export const matchPerson = createAction({
  name: 'matchPerson',
  displayName: 'Match Person',
  description: '',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
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
      const cachedResult = await store.get(`_apollo_person_${propsValue.email}`, StoreScope.PROJECT);
      if (cachedResult) {
        return cachedResult;
      }
    }
    const result = await httpClient.sendRequest<{ person: Record<string, unknown> }>({
      method: HttpMethod.POST,
      url: `https://api.apollo.io/v1/people/match`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        api_key: auth,
        email: propsValue.email,
      }
    });
    const personResult = result.body.person || {};
    if (propsValue.cacheResponse) {
      await store.put(`_apollo_person_${propsValue.email}`, personResult, StoreScope.PROJECT);
    }
    return personResult;
  },
});
