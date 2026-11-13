import { microsoftTeamsAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import type { MicrosoftTeamsMember, MicrosoftTeamsPage } from '../common/types';
import { microsoftTeamsGetChannelMessageOutputSchema } from '../output-schemas';

export const sendChannelMessageAction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_send_channel_message',
  outputSchema: microsoftTeamsGetChannelMessageOutputSchema,
  classification: 'WRITE',
  displayName: 'Send Channel Message',
  description: "Sends a message to a teams's channel.",
  audience: 'human',
  aiMetadata: {
    description: 'Posts a new top-level message to a Microsoft Teams channel, identified by team ID and channel ID. Use to broadcast to a channel rather than a private chat; to answer an existing thread use Reply to Channel Message instead. Supports @username mentions, which are resolved to team members before posting. Not idempotent — each call posts another message.',
    idempotent: false,
  },
  props: {
    teamId: microsoftTeamsProps.teamId({ required: true }),
    channelId: microsoftTeamsProps.channelId({ required: true }),
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

    const client = microsoftTeamsClient.create({ auth: context.auth });

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
    const normalize = (value: string) => value.trim().toLowerCase();
    const mentionHandles = Array.from(
      content.matchAll(new RegExp(mentionPattern.source, 'g')),
      (match) => match[2]
    );

    if (mentionHandles.length > 0) {
      const uniqueHandles = [...new Set(mentionHandles.map(normalize))];

      const filterClauses = uniqueHandles.flatMap((handle) => [
        `microsoft.graph.aadUserConversationMember/displayName eq '${handle}'`,
        `startswith(microsoft.graph.aadUserConversationMember/email, '${handle}@')`,
      ]);

      const members: MicrosoftTeamsMember[] = [];
      let response: MicrosoftTeamsPage<MicrosoftTeamsMember> = await microsoftTeamsClient.withRetry(() =>
        client
          .api(`/teams/${teamId}/members`)
          .filter(filterClauses.join(' or '))
          .get(),
      );

      while (response.value && response.value.length > 0) {
        members.push(...response.value);
        const nextLink = response['@odata.nextLink'];
        if (nextLink) {
          response = await microsoftTeamsClient.withRetry(() => client.api(nextLink).get());
        } else {
          break;
        }
      }

      const byHandle = new Map<string, MicrosoftTeamsMember>();

      for (const member of members) {
        const keys = [
          member.displayName,
          member.userPrincipalName,
          member.email,
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
          const displayName =
            member.displayName ||
            member.userPrincipalName ||
            member.userId;
          if (!displayName || !member.userId) {
            return match;
          }

          const mentionId = messageMentions.length;
          messageMentions.push({
            id: mentionId,
            mentionText: displayName,
            mentioned: {
              user: {
                id: member.userId,
                displayName: displayName,
                userPrincipalName: member.userPrincipalName,
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
