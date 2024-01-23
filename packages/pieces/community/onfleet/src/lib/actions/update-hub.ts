import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const updateHub = createAction({
  auth: onfleetAuth,
  name: 'update_hub',
  displayName: 'Update Hub',
  description: 'Update an existing hub',
  props: {
    hub: common.hub,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the hub',
      required: false,
    }),
    teams: common.teams,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);
    const options: any = {};

    if (context.propsValue.name) options.name = context.propsValue.name;
    if (context.propsValue.teams) options.teams = context.propsValue.teams;

    return await onfleetApi.hubs.update(
      context.propsValue.hub as string,
      options
    );
  },
});
