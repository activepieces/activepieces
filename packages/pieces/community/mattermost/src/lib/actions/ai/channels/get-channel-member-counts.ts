import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelMemberCountsOutputSchema } from '../../../output-schemas';

export const getChannelMemberCountsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_member_counts',
  outputSchema: mattermostGetChannelMemberCountsOutputSchema,
  displayName: 'Get Channel Member Counts',
  description: 'Gets the member count of several channels.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the member count of each given channel, keyed by channel ID. For one channel\'s pinned post and file counts too use Get Channel Stats.',
    idempotent: true,
  },
  props: {
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'IDs of the channels to count. Use List User Channels or Search Channels to find them.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/channels/stats/member_count',
      body: context.propsValue.channelIds,
    });
  },
});
