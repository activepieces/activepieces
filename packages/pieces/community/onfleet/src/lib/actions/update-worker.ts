import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const updateWorker = createAction({
  auth: onfleetAuth,
  name: 'update_worker',
  displayName: 'Update Worker',
  description: 'Update an existing worker',
  props: {
    worker: common.worker,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the worker',
      required: false,
    }),
    teams: common.teams,
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

    const options: any = {};

    if (context.propsValue.name) options.name = context.propsValue.name;
    if (context.propsValue.teams) options.teams = context.propsValue.teams;
    if (context.propsValue.capacity)
      options.capacity = context.propsValue.capacity;
    if (context.propsValue.displayName)
      options.displayName = context.propsValue.displayName;

    return await onfleetApi.workers.update(
      context.propsValue.worker as string,
      options
    );
  },
});
