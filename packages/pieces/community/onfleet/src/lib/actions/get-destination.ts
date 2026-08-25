import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getDestination = createAction({
  auth: onfleetAuth,
  name: 'get_destination',
  displayName: 'Get Destination',
  description: 'Get a specific destination',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single Onfleet destination (a stored delivery address) by its destination ID. Read-only and idempotent. Use when you already have the destination ID and need its address details.',
    idempotent: true,
  },
  props: {
    destination: Property.ShortText({
      displayName: 'Destination ID',
      description: 'The ID of the destination you want to delete',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.destinations.get(context.propsValue.destination);
  },
});
