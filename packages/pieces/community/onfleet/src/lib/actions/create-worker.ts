import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const createWorker = createAction({
  auth: onfleetAuth,
  name: 'create_worker',
  displayName: 'Create Worker',
  description: 'Create a new worker',
  audience: 'both',
  aiMetadata: { description: 'Creates a new Onfleet worker (driver) from a name and phone, assigned to one or more required teams, with optional capacity and display name. Not idempotent: calling it repeatedly creates duplicate workers. Use update-worker to modify an existing driver.', idempotent: false },
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
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.workers.create({
      name: context.propsValue.name,
      phone: context.propsValue.phone,
      teams: context.propsValue.teams as string[],
      capacity: context.propsValue.capacity,
      displayName: context.propsValue.displayName,
    });
  },
});
