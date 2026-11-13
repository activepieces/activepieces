import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostConvertGroupMessageToChannelOutputSchema } from '../../../output-schemas';

export const convertGroupMessageToChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_convert_group_message_to_channel',
  outputSchema: mattermostConvertGroupMessageToChannelOutputSchema,
  displayName: 'Convert Group Message To Channel',
  description: 'Converts a group message into a private channel in a team.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Turns a group message (type "G") into a private channel in a team, keeping its members and history. It cannot be converted back. The team must be one all members share, from List Group Message Common Teams.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({
      required: true,
      displayName: 'Group Message Channel ID',
      description: 'ID of a group message channel (type "G"). Use Search Group Messages or List User Channels to find it.',
    }),
    teamId: mattermostAiProps.teamId({
      required: true,
      description: 'ID of the team for the new private channel. Use List Group Message Common Teams to find one.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Unique handle for the new channel\'s URL: lowercase letters, numbers, "-" and "_", e.g. "launch-crew".',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Channel name shown to users.',
      required: true,
    }),
  },
  async run(context) {
    const { channelId, teamId, name, displayName } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/channels/${encodeURIComponent(channelId)}/convert_to_channel`,
      body: { channel_id: channelId, team_id: teamId, name, display_name: displayName },
    });
  },
});
