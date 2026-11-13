import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostListGroupChannelUsersOutputSchema } from '../../../output-schemas';

export const listGroupChannelUsersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_group_channel_users',
  outputSchema: mattermostListGroupChannelUsersOutputSchema,
  displayName: 'List Group Message Members',
  description: 'Lists the members of group message channels.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the members of each given group message channel, keyed by channel ID. Channels the connected user is not a member of are left out. Group message channel IDs come from List User Channels.',
    idempotent: true,
  },
  props: {
    channelIds: Property.Array({
      displayName: 'Group Channel IDs',
      description: 'IDs (26 characters each) of group message channels (type "G").',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/users/group_channels',
      body: context.propsValue.channelIds,
    });
  },
});
