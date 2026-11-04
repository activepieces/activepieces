import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListDraftsOutputSchema } from '../../../output-schemas';

export const listDraftsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_drafts',
  outputSchema: mattermostListDraftsOutputSchema,
  displayName: 'List Drafts',
  description: 'Lists a user\'s saved drafts in a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every unsent message draft a user has saved in a team\'s channels and threads; pass "me" for the connected account. Needs synced drafts enabled on the server.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { userId, teamId } = context.propsValue;
    const drafts = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/drafts`,
    });
    return { drafts, count: drafts.length };
  },
});
