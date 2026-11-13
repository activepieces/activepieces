import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListThreadsOutputSchema } from '../../../output-schemas';

export const listThreadsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_threads',
  outputSchema: mattermostListThreadsOutputSchema,
  displayName: 'List Followed Threads',
  description: 'Lists the threads a user follows in a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the threads a user follows in a team, newest activity first, with reply counts and unread state; pass "me" for the connected account. Needs collapsed reply threads enabled on the server.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    since: Property.Number({
      displayName: 'Since',
      description: 'Only threads with activity after this time, in milliseconds since epoch.',
      required: false,
    }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Deleted',
      description: '"true" to include threads whose root post was deleted. Defaults to "false".',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { userId, teamId, since, includeDeleted, page, perPage } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/threads`,
      query: {
        ...mattermostUtils.paging({ page, perPage }),
        ...(since !== undefined ? { since: String(since) } : {}),
        ...(deleted !== undefined ? { deleted: String(deleted) } : {}),
      },
    });
  },
});
