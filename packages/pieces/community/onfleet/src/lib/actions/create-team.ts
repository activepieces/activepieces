import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const createTeam = createAction({
  auth: onfleetAuth,
  name: 'create_team',
  displayName: 'Create Team',
  description: 'Create a new team',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the team',
      required: true,
    }),
    workers: common.workers,
    managers: common.managers,
    hub: common.hubOptional,
    enableSelfAssignment: Property.Checkbox({
      displayName: 'Enable Self Assignment',
      description:
        'Allows Drivers to Self Assign Tasks that are in the Team unassigned container.',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.teams.create({
      name: context.propsValue.name,
      workers: context.propsValue.workers,
      managers: context.propsValue.managers,
      hub: context.propsValue.hub,
      enableSelfAssignment: context.propsValue.enableSelfAssignment,
    });
  },
});
