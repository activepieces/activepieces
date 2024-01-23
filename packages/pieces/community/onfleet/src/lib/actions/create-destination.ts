import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const createDestination = createAction({
  auth: onfleetAuth,
  name: 'create_destination',
  displayName: 'Create Destination',
  description: 'Create a new destination',
  props: {
    destination: common.destination,
    unparsedDestination: common.unparsedDestination,
    notes: Property.ShortText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    let address;
    if (context.propsValue.unparsedDestination) {
      address = {
        number: '',
        street: '',
        city: '',
        country: '',
        unparsed: context.propsValue.destination['unparsedAddress'],
      };
    } else {
      address = {
        number: context.propsValue.destination['number'],
        street: context.propsValue.destination['street'],
        apartment: context.propsValue.destination['apartment'],
        city: context.propsValue.destination['city'],
        country: context.propsValue.destination['country'],
        state: context.propsValue.destination['state'],
        postalCode: context.propsValue.destination['postalCode'],
        name: context.propsValue.destination['name'],
      };
    }

    return await onfleetApi.destinations.create({
      address: address,
      notes: context.propsValue.notes,
    });
  },
});
