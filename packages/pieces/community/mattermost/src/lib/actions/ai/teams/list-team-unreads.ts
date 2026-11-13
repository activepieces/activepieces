import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListTeamUnreadsOutputSchema } from '../../../output-schemas';

export const listTeamUnreadsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_team_unreads',
  outputSchema: mattermostListTeamUnreadsOutputSchema,
  displayName: 'List Team Unreads',
  description: 'Lists unread message and mention counts for each of a user\'s teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns unread message and mention counts per team for every team the user is on; pass "me" for the connected account. For one team use Get Team Unread.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    excludeTeamId: mattermostAiProps.teamId({
      required: false,
      displayName: 'Exclude Team ID',
      description: 'Team ID (26 characters) to leave out of the results. Use List User Teams to find it.',
    }),
    includeCollapsedThreads: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Collapsed Threads',
      description: '"true" to count unread replies in collapsed threads too. Defaults to "false".',
    }),
  },
  async run(context) {
    const { userId, excludeTeamId, includeCollapsedThreads } = context.propsValue;
    const collapsedThreads = mattermostUtils.parseBoolean({ value: includeCollapsedThreads });
    const unreads = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/unread`,
      query: {
        exclude_team: excludeTeamId ?? '',
        ...(collapsedThreads !== undefined ? { include_collapsed_threads: String(collapsedThreads) } : {}),
      },
    });
    return { unreads, count: unreads.length };
  },
});
