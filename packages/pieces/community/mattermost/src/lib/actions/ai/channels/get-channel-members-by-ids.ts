import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelMembersByIdsOutputSchema } from '../../../output-schemas';

export const getChannelMembersByIdsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_members_by_ids',
  outputSchema: mattermostGetChannelMembersByIdsOutputSchema,
  displayName: 'Get Channel Members By IDs',
  description: 'Gets the channel memberships of several users.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the memberships in one channel of the given users; users not in the channel are left out, so it doubles as a membership check. For one user use Get Channel Member.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'User IDs (26 characters) to look up. Use Get User By Username or Search Users to find them.',
      required: true,
    }),
  },
  async run(context) {
    const { channelId, userIds } = context.propsValue;
    const members = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/channels/${encodeURIComponent(channelId)}/members/ids`,
      body: userIds,
    });
    return { members, count: members.length };
  },
});
