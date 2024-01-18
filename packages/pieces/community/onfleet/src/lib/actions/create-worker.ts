import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const createWorker = createAction({
  auth: onfleetAuth,
  name: 'create_worker',
  displayName: 'Create Worker',
  description: 'Create a new worker',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the worker',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: true,
    }),
    teams: common.teamsRequired,
    capacity: Property.Number({
      displayName: 'Capacity',
      description: 'The maximum number of units this worker can carry',
      required: false,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.workers.create({
      name: context.propsValue.name,
      phone: context.propsValue.phone,
      teams: context.propsValue.teams as string[],
      capacity: context.propsValue.capacity,
      displayName: context.propsValue.displayName,
    });
  },
});
