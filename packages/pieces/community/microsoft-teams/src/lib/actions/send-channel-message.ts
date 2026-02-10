import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const sendChannelMessageAction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_send_channel_message',
  displayName: 'Send Channel Message',
  description: "Sends a message to a teams's channel.",
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
          {
            label: 'Text',
            value: 'text',
          },
          {
            label: 'HTML',
            value: 'html',
          },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    mentions: microsoftTeamsCommon.memberIds(false),
  },
  async run(context) {
    const { teamId, channelId, contentType, content, mentions } =
      context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    let messageContent = content;
    const messageMentions: any[] = [];
    if (mentions && mentions.length > 0) {
      const memberPromises = mentions.map((memberId: string) =>
        client.api(`/teams/${teamId}/members/${memberId}`).get()
      );
      const memberDetails = await Promise.all(memberPromises);

      messageContent = content;
      memberDetails.forEach((member, index) => {
        const displayName =
          member.displayName || member.userPrincipalName || member.userId;

        messageMentions.push({
          id: index,
          mentionText: displayName,
          mentioned: {
            user: {
              id: member.userId,
              displayName: displayName,
              userPrincipalName: member.userPrincipalName,
            },
          },
        });
      });

      if (contentType === 'text') {
        const mentionStrings = memberDetails
          .map(
            (member, index) =>
              `<at id="${index}">${
                member.displayName || member.userPrincipalName
              }</at>`
          )
          .join(' ');
        messageContent = `<div><div>${mentionStrings}</div>\n<div>${content}</div>\n</div>`;
      }
    }

    //https://learn.microsoft.com/en-us/graph/api/channel-post-messages?view=graph-rest-1.0&tabs=http
    const chatMessage: any = {
      body: {
        content: messageContent,
        contentType: messageMentions.length > 0 ? 'html' : contentType,
      },
    };

    if (messageMentions.length > 0) {
      chatMessage.mentions = messageMentions;
    }

    return await client
      .api(`/teams/${teamId}/channels/${channelId}/messages`)
      .post(chatMessage);
  },
});
