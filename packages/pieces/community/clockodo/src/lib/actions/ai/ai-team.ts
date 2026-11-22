import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

export const aiGetTeam = createAction({
  auth: clockodoAuth,
  name: 'ai_get_team',
  classification: 'READ',
  displayName: 'Get Team',
  description: 'Retrieves a single team from Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.team,
  aiMetadata: {
    description: 'Returns one Clockodo team by its numeric team id (find ids with Get Teams). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    team_id: clockodoAiProps.id({ displayName: 'Team ID', source: 'Get Teams', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.team_id, field: 'Team ID' });
    return makeClient(auth.props).getTeam(id);
  },
});
