import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { microsoftTeamsAuth } from '../auth';
import { microsoftTeamsCommon } from '../common';

export const sendChannelMessageAsBotAction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_send_channel_message_as_bot',
  displayName: 'Send Channel Message as Bot',
  description: 'Sends a message to a channel from the Activepieces Bot. The bot must be installed in the team first.',
  props: {
    teamId: microsoftTeamsCommon.teamId,
    channelId: microsoftTeamsCommon.channelId,
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

    const claims = JSON.parse(
      Buffer.from(context.auth.access_token.split('.')[1], 'base64').toString(),
    );
    const tenantId = claims['tid'] as string;

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}/v1/teams-bot/send`,
      headers: { Authorization: `Bearer ${context.server.token}` },
      body: { tenantId, teamId, channelId, content, contentType },
    });
  },
});
