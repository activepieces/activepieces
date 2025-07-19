import { Property, createAction } from '@ensemble/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getDestination = createAction({
  auth: onfleetAuth,
  name: 'get_destination',
  displayName: 'Get Destination',
  description: 'Get a specific destination',
  props: {
    destination: Property.ShortText({
      displayName: 'Destination ID',
      description: 'The ID of the destination you want to delete',
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.destinations.get(context.propsValue.destination);
  },
});
