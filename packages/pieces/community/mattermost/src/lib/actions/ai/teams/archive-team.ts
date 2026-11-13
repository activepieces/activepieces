import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const archiveTeamAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_archive_team',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Archive Team',
  description: 'Archives a team (soft delete); it can be restored later.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Archives a team: it is soft deleted and hidden from users, but its data is kept and Restore Team brings it back. Never deletes permanently. Needs the manage_team permission.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}`,
    });
  },
});
