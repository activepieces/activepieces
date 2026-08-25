import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const updateTeam = createAction({
  auth: onfleetAuth,
  name: 'update_team',
  displayName: 'Update Team',
  description: 'Update an existing team',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Onfleet team by team ID, changing name, worker membership, hub, or self-assignment setting. Not idempotent: it patches the live team and reassigning workers replaces the prior set. Requires a known team ID; use create-team to add a new team.', idempotent: false },
  props: {
    team: common.team,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the team',
      required: false,
    }),
    workers: common.workersOptional,
    managers: common.managersOptional,
    hub: common.hubOptional,
    enableSelfAssignment: Property.Checkbox({
      displayName: 'Enable Self Assignment',
      description:
        'Allows Drivers to Self Assign Tasks that are in the Team unassigned container.',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    const options: any = {};
    if (context.propsValue.name) options.name = context.propsValue.name;
    if (context.propsValue.workers)
      options.workers = context.propsValue.workers;
    if (context.propsValue.hub) options.hub = context.propsValue.hub;
    if (context.propsValue.enableSelfAssignment)
      options.enableSelfAssignment = context.propsValue.enableSelfAssignment;

    return await onfleetApi.teams.update(
      context.propsValue.team as string,
      options
    );
  },
});
