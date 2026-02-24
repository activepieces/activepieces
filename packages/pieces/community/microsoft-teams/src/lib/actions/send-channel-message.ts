import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { ConversationMember } from '@microsoft/microsoft-graph-types';
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
      description: 'Use @username to mention team members in the message.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, channelId, contentType, content } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    let messageContent = content;
    const messageMentions: Array<{
      id: number;
      mentionText: string;
      mentioned: {
        user: {
          id: string;
          displayName: string;
          userPrincipalName?: string;
        };
      };
    }> = [];
    const mentionPattern = /(^|[\s(>])@([A-Za-z0-9._-]+)/g;
    const mentionHandles = Array.from(
      content.matchAll(new RegExp(mentionPattern.source, 'g')),
      (match) => match[2]
    );

    if (mentionHandles.length > 0) {
      const members: ConversationMember[] = [];
      let response: PageCollection = await client
        .api(`/teams/${teamId}/members`)
        .get();
      while (response.value.length > 0) {
        members.push(...(response.value as ConversationMember[]));
        if (response['@odata.nextLink']) {
          response = await client.api(response['@odata.nextLink']).get();
        } else {
          break;
        }
      }

      const normalize = (value: string) => value.trim().toLowerCase();
      const byHandle = new Map<string, ConversationMember>();

      for (const member of members) {
        const typedMember = member as ConversationMember & {
          userPrincipalName?: string;
          userId?: string;
          email?: string;
        };
        const keys = [
          typedMember.displayName,
          typedMember.userPrincipalName,
          typedMember.email,
        ].filter((value): value is string => Boolean(value));

        for (const key of keys) {
          byHandle.set(normalize(key), member);
          if (key.includes('@')) {
            byHandle.set(normalize(key.split('@')[0]), member);
          }
          if (key.includes(' ')) {
            byHandle.set(normalize(key.replace(/\s+/g, '')), member);
          }
        }
      }

      messageContent = content.replace(
        mentionPattern,
        (match, prefix: string, handle: string) => {
          const member = byHandle.get(normalize(handle));
          if (!member) {
            return match;
          }
          const typedMember = member as ConversationMember & {
            userPrincipalName?: string;
            userId?: string;
          };
          const displayName =
            typedMember.displayName ||
            typedMember.userPrincipalName ||
            typedMember.userId;
          if (!displayName || !typedMember.userId) {
            return match;
          }

          const mentionId = messageMentions.length;
          messageMentions.push({
            id: mentionId,
            mentionText: displayName,
            mentioned: {
              user: {
                id: typedMember.userId,
                displayName: displayName,
                userPrincipalName: typedMember.userPrincipalName,
              },
            },
          });

          return `${prefix}<at id="${mentionId}">${displayName}</at>`;
        }
      );

      if (contentType === 'text' && messageMentions.length > 0) {
        messageContent = `<div>${messageContent.replace(/\n/g, '<br>')}</div>`;
      }
    }

    //https://learn.microsoft.com/en-us/graph/api/channel-post-messages?view=graph-rest-1.0&tabs=http
    const chatMessage: {
      body: {
        content: string;
        contentType: 'text' | 'html';
      };
      mentions?: typeof messageMentions;
    } = {
      body: {
        content: messageContent,
        contentType: 'html',
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
