import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const createHub = createAction({
  auth: onfleetAuth,
  name: 'create_hub',
  displayName: 'Create Hub',
  description: 'Create a new hub',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the hub',
      required: true,
    }),
    destination: common.destination,
    unparsedDestination: common.unparsedDestination,
    teams: common.teams,
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

    const options: any = {
      address: address,
      name: context.propsValue.name,
    };

    if (context.propsValue.teams) {
      options.teams = context.propsValue.teams;
    }

    return await onfleetApi.hubs.create(options);
  },
});
