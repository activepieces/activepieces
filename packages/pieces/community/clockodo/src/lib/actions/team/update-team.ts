import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'update_team',
  classification: 'WRITE',
  displayName: 'Update Team',
  description: 'Renames a team in Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.team,
  aiMetadata: {
    description:
      'Renames an existing Clockodo team and optionally sets its leader (user id from Get Users) for the team identified by its numeric team id (find it with Get Teams). Idempotent: sending the same name again leaves the team unchanged.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'The numeric ID of the team (from Get Teams)',
      required: true,
    }),
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
    const id = clockodoRequests.parseId({ value: propsValue.team_id, field: 'Team ID' });
    const name = clockodoRequests.requireValue({ value: propsValue.name.trim(), field: 'Name' });
    const leader = clockodoRequests.parseOptionalId({ value: propsValue.leader_id, field: 'Leader User ID' });
    return makeClient(auth.props).updateTeam({ id, request: leader === undefined ? { name } : { name, leader } });
  },
});
