import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateTeamOutputSchema } from '../../../output-schemas';

export const getTeamByNameAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_by_name',
  outputSchema: mattermostCreateTeamOutputSchema,
  displayName: 'Get Team By Name',
  description: 'Gets a team by its handle (the name in the team URL).',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the team whose handle (the name in its URL, e.g. "engineering") matches exactly; use it to turn a handle into a team ID. For partial matches use Search Teams.',
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
      path: `/teams/name/${encodeURIComponent(context.propsValue.teamName)}`,
    });
  },
});
