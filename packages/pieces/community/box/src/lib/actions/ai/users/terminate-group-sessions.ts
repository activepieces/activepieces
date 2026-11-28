import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';
import { boxTerminateGroupSessionsOutputSchema } from '../../../output-schemas';

export const terminateGroupSessionsAction = createAction({
  auth: boxAuth,
  name: 'box_terminate_group_sessions',
  outputSchema: boxTerminateGroupSessionsOutputSchema,
  displayName: 'Terminate Group Sessions',
  description: 'Signs every member of Box groups out of all their sessions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts background jobs that sign every member of the given groups out of all Box sessions and returns a status message. Needs admin rights. Get group IDs from List Groups; use Terminate User Sessions for single users.',
    idempotent: false,
  },
  props: {
    groupIds: Property.Array({
      displayName: 'Group IDs',
      description: 'Box group IDs whose members are signed out. Get them from List Groups.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const groupIds = propsValue.groupIds.map(String);
    if (groupIds.length === 0) {
      throw new Error('Give at least one entry in Group IDs.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/groups/terminate_sessions',
      body: { group_ids: groupIds },
    });
  },
});
