import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const getChannelByNameAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_by_name',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Get Channel By Name',
  description: 'Gets a channel by its handle within a team.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one channel by its unique handle (the name in its URL, e.g. "town-square") within a team; the usual way to turn a channel name into its ID. For a partial match use Search Channels.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    channelName: Property.ShortText({
      displayName: 'Channel Name',
      description: 'The channel\'s handle from its URL, e.g. "town-square", not its display name.',
      required: true,
    }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Archived',
      description: '"true" to also find an archived channel. Defaults to "false".',
    }),
  },
  async run(context) {
    const { teamId, channelName, includeDeleted } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(teamId)}/channels/name/${encodeURIComponent(channelName)}`,
      query: deleted !== undefined ? { include_deleted: String(deleted) } : undefined,
    });
  },
});
