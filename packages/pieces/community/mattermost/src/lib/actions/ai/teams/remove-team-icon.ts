import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const removeTeamIconAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_remove_team_icon',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Remove Team Icon',
  description: 'Removes a team\'s custom icon.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes the team\'s custom icon so the default initials show again; the image is not kept. Needs the manage_team permission.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}/image`,
    });
  },
});
