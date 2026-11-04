import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCheckTeamExistsOutputSchema } from '../../../output-schemas';

export const checkTeamExistsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_check_team_exists',
  outputSchema: mattermostCheckTeamExistsOutputSchema,
  displayName: 'Check Team Exists',
  description: 'Checks whether a team handle is already taken.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Tells whether a team with this handle exists, e.g. before Create Team. Use Get Team By Name to read the team itself.',
    idempotent: true,
  },
  props: {
    teamName: Property.ShortText({
      displayName: 'Team Name',
      description: 'Team handle from the team URL, e.g. "engineering". Not the display name.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/name/${encodeURIComponent(context.propsValue.teamName)}/exists`,
    });
  },
});
