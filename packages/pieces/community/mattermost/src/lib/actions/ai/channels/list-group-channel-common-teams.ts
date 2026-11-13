import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListGroupChannelCommonTeamsOutputSchema } from '../../../output-schemas';

export const listGroupChannelCommonTeamsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_group_channel_common_teams',
  outputSchema: mattermostListGroupChannelCommonTeamsOutputSchema,
  displayName: 'List Group Message Common Teams',
  description: 'Lists the teams every member of a group message belongs to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the teams that all active members of a group message share; empty when there are none. Use it to pick the team for Convert Group Message To Channel.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({
      required: true,
      displayName: 'Group Message Channel ID',
      description: 'ID of a group message channel (type "G"). Use Search Group Messages or List User Channels to find it.',
    }),
  },
  async run(context) {
    const teams = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/channels/${encodeURIComponent(context.propsValue.channelId)}/common_teams`,
    });
    return { teams, count: teams.length };
  },
});
