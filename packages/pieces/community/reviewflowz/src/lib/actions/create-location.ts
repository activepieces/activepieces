import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';

export const createLocationAction = createAction({
  auth: reviewflowzAuth,
  name: 'create_location',
  classification: 'WRITE',
  displayName: 'Create Location',
  description: 'Adds a location (a store, office or property) to Reviewflowz.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a Reviewflowz location (a store, office or property) from its Google Maps link, which finds the place and its address. Each call creates a new location, so retries duplicate; use Find Location first to check.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
    url: Property.ShortText({
      displayName: 'Google Maps link',
      description: "The location's Google Maps link, like https://maps.google.com/?cid=123: it finds the place and its address.",
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    return reviewflowzApi.call({
      auth,
      method: HttpMethod.POST,
      path: '/locations',
      body: { name: input.name, url: input.url, ...(input.address ? { address: input.address } : {}) },
    });
  },
});
