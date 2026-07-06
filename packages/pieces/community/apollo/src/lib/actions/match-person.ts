import { apolloAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const matchPerson = createAction({
  name: 'matchPerson',
  displayName: 'Match Person',
  description: 'Enrich a persons details using their email address',
  audience: 'both',
  aiMetadata: {
    description: 'Look up and enrich a single person in the Apollo database by their email address, returning their profile data. Use when you have an email and need the matching contact/profile details. Read-only and idempotent; an optional project-store cache may return a previously fetched result for the same email.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: ' The email address of the person to be matched',
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
        `_apollo_person_${propsValue.email}`,
        StoreScope.PROJECT
      );
      if (cachedResult) {
        return cachedResult;
      }
    }
    const result = await httpClient.sendRequest<{
      person: Record<string, unknown>;
    }>({
      method: HttpMethod.POST,
      url: `https://api.apollo.io/v1/people/match`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${auth.secret_text}`,
      },
      body: {
       
        email: propsValue.email,
      },
    });
    const personResult = result.body.person || {};
    if (propsValue.cacheResponse) {
      await store.put(
        `_apollo_person_${propsValue.email}`,
        personResult,
        StoreScope.PROJECT
      );
    }
    return personResult;
  },
});
