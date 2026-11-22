import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'create_team',
  classification: 'WRITE',
  displayName: 'Create Team',
  description: 'Creates a team in Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.team,
  aiMetadata: {
    description:
      'Creates a new Clockodo team with the given name and optional leader user id and returns it with its numeric id. Not idempotent: each call adds another team even with the same name, so check Get Teams first. Requires a Clockodo plan with teams and an owner/admin API user.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    leader_id: Property.ShortText({
      displayName: 'Leader User ID',
      description: 'Optional numeric user ID of the team leader (from Get Users).',
      placeholder: 'e.g. 489171',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const name = clockodoRequests.requireValue({ value: propsValue.name.trim(), field: 'Name' });
    const leader = clockodoRequests.parseOptionalId({ value: propsValue.leader_id, field: 'Leader User ID' });
    return makeClient(auth.props).createTeam(leader === undefined ? { name } : { name, leader });
  },
});
