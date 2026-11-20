import { apolloAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const matchPerson = createAction({
  name: 'matchPerson',
  classification: 'READ',
  displayName: 'Match Person',
  description: "Get a person's profile from their email address.",
  audience: 'both',
  aiMetadata: {
    description: 'Look up and enrich a single person in the Apollo database by their email address, returning their profile data. Use when you have an email and need the matching contact/profile details. Read-only and idempotent; an optional project-store cache may return a previously fetched result for the same email.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'person',
      display: 'section',
      label: 'Person',
      icon: 'user',
      props: ['email'],
    },
  ],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the person to look up.',
      placeholder: 'jane@acme.com',
      required: true,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Reuse a saved result for the same input. Saved results never expire.',
      advanced: true,
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
