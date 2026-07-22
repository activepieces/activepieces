import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { microsoftTeamsBotAuth } from '../auth';
import { microsoftTeamsBotCommon } from '../common';

export const sendChannelMessageAsBotAction = createAction({
  auth: microsoftTeamsBotAuth,
  name: 'microsoft_teams_send_channel_message_as_bot',
  displayName: 'Send Channel Message as Bot',
  description: 'Sends a message to a channel from the Activepieces Bot. The bot must be installed in the team first.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a message to a Teams channel as the Activepieces Bot, instead of as the connected user. Requires the bot to already be installed in the target team (via the Teams app store or a sideloaded package). Each call posts a new message, so retries duplicate.',
    idempotent: false,
  },
  props: {
    teamId: microsoftTeamsBotCommon.teamId,
    channelId: microsoftTeamsBotCommon.channelId,
    contentType: Property.StaticDropdown({
      displayName: 'Content Type',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, channelId, contentType, content } = context.propsValue;
    const { appId, appSecret, tenantId } = context.auth.props;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/teams-bot/send`,
      headers: { Authorization: `Bearer ${context.server.token}` },
      body: { appId, appSecret, tenantId, teamId, channelId, content, contentType },
    });

    return response.body;
  },
});
