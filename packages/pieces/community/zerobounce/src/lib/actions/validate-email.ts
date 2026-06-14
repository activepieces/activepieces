import { zerobounceAuth } from '../..';
import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const validateEmail = createAction({
  name: 'validateEmail',
  displayName: 'Validate Email',
  description: '',
  audience: 'both',
  aiMetadata: { description: 'Validates a single email address through ZeroBounce, returning its deliverability status (e.g. valid, invalid, catch-all, abuse) plus related quality signals. Use to verify an address before sending or storing it. Optionally caches the result in the project store so repeat lookups of the same address skip the API call; this is a read-only check that is safe to repeat.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: true,
    }),
  },
  auth: zerobounceAuth,
  async run({ store, propsValue, auth }) {
    const key = `_zerobounce_${propsValue.email}`;
    if (propsValue.cacheResponse) {
      const cachedResponse = await store.get(key, StoreScope.PROJECT);
      if (!isNil(cachedResponse)) {
        return cachedResponse
      }
    }
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `https://api.zerobounce.net/v2/validate?email=${propsValue.email}&api_key=${auth.secret_text}`,
    });
    if (propsValue.cacheResponse) {
      await store.put(key, res.body, StoreScope.PROJECT);
    }
    return res.body;
  },
});
