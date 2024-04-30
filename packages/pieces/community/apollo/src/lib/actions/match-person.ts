import { apolloAuth } from '../../';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const matchPerson = createAction({
  name: 'matchPerson',
  displayName: 'Match Person',
  description: '',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: '',
      required: true,
    })
  },
  auth: apolloAuth,
  async run({ propsValue, auth, store }) {
    const cachedResult = await store.get(`_apollo_person_${propsValue.email}`)
    if (cachedResult) {
      return cachedResult;
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
    await store.put(`_apollo_person_${propsValue.email}`, result.body.person);
    return result.body.person;
  },
});
