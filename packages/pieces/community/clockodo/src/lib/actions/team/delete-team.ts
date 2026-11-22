import { Property, createAction } from '@activepieces/pieces-framework';
import { deletedResult, makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_team',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Team',
  description: 'Deletes a team in Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo team by its numeric team id (find it with Get Teams). Members stay as users without a team. Not idempotent: a second call for the same id fails because the team is gone.',
    idempotent: false,
  },
  props: {
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'The numeric ID of the team (from Get Teams)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.team_id, field: 'Team ID' });
    await makeClient(auth.props).deleteTeam(id);
    return deletedResult(id);
  },
});
