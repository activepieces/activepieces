import { Property, StoreScope, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf, isRecord } from '../common/client';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloRequests } from '../common/requests';

export const matchPerson = createAction({
  name: 'matchPerson',
  classification: 'READ',
  displayName: 'Match Person',
  description: "Enrich a person's details using their email address. Uses 1 Apollo credit when a match is found.",
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up one person in the Apollo database by email and returns their profile, or an empty object when there is no match. Uses 1 Apollo credit per match. With Cache Response on, a previously found person is returned from the project store without a new request.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the person to be matched',
      required: true,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store a found person in the project store and reuse it for the same email. People that were not found are never cached.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: apolloOutputSchemas.rawPerson,
  auth: apolloAuth,
  async run({ propsValue, auth, store }) {
    const email = String(propsValue.email ?? '').trim();
    if (email === '') {
      throw new Error('Email is required.');
    }
    const cacheKey = `_apollo_person_${email}`;
    if (propsValue.cacheResponse) {
      const cached = await store.get<unknown>(cacheKey, StoreScope.PROJECT);
      if (isRecord(cached) && Object.keys(cached).length > 0) {
        return cached;
      }
    }
    const response = await apolloRequests.matchPerson({ apiKey: apiKeyOf(auth), query: { email } });
    const person = isRecord(response['person']) ? response['person'] : {};
    if (propsValue.cacheResponse && Object.keys(person).length > 0) {
      await store.put(cacheKey, person, StoreScope.PROJECT);
    }
    return person;
  },
});
