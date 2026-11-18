import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelsByIdsOutputSchema } from '../../../output-schemas';

export const getChannelsByIdsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channels_by_ids',
  outputSchema: mattermostGetChannelsByIdsOutputSchema,
  displayName: 'Get Channels By IDs',
  description: 'Gets several public channels of a team by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the public channels of one team matching a list of channel IDs. For a single channel of any type use Get Channel.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'IDs of public channels in the team. Use Search Channels or List Public Channels to find them.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, channelIds } = context.propsValue;
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/channels/ids`,
      body: channelIds,
    });
    return { channels, count: channels.length };
  },
});
