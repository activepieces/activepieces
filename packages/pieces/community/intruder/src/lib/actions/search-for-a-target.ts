import { createAction, Property } from '@activepieces/pieces-framework';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchForATarget = createAction({
  auth: intruderAuth,
  name: 'searchForATarget',
  displayName: 'Search For a Target',
  description: 'Search for targets by address',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up registered targets in the Intruder account that match a given address or domain. Use when an agent needs to find an existing target or confirm one is registered before scanning. The address is required. Idempotent: a read-only lookup that does not modify any data.',
    idempotent: true,
  },
  props: {
    address: Property.ShortText({
      displayName: 'Target Address',
      description:
        'The address or domain to search for (e.g., example.com, 192.168.1.1)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/targets/?address=${encodeURIComponent(propsValue.address)}`
    );

    return response;
  },
});
