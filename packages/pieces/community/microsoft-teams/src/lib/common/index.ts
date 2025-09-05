import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Team, Channel, Chat, ConversationMember, ChatMessage, User } from '@microsoft/microsoft-graph-types';
import { microsoftTeamsAuth } from '../../';

export const microsoftTeamsCommon = {
    teamId: Property.Dropdown({
        displayName: 'Team',
        refreshers: [],
        required: true,
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first.',
                    options: [],
                };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api('/me/joinedTeams').get();
            while (response.value.length > 0) {
                for (const team of response.value as Team[]) {
                    options.push({ label: team.displayName!, value: team.id! });
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
            return { disabled: false, options };
        },
    }),
    channelId: Property.Dropdown({
        displayName: 'Channel',
        refreshers: ['teamId'],
        required: true,
        options: async ({ auth, teamId }) => {
            if (!auth || !teamId) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account and select a team.',
                    options: [],
                };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api(`/teams/${teamId}/channels`).get();
            while (response.value.length > 0) {
                for (const channel of response.value as Channel[]) {
                    options.push({ label: channel.displayName!, value: channel.id! });
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
            return { disabled: false, options };
        },
    }),
    messageId: Property.Dropdown({
        displayName: 'Message',
        description: 'The message to interact with.',
        refreshers: ['channelId'],
        required: true,
        options: async ({ auth, teamId, channelId }) => {
            if (!auth || !teamId || !channelId) {
                return {
                    disabled: true,
                    placeholder: 'Please select a team and channel first.',
                    options: [],
                };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api(`/teams/${teamId}/channels/${channelId}/messages`).top(50).get();
            while (response.value.length > 0) {
                for (const message of response.value as ChatMessage[]) {
                    if (message.body?.content) {
                        const contentSnippet = message.body.content.replace(/<[^>]*>?/gm, '').substring(0, 100);
                        const sender = message.from?.user?.displayName || 'Unknown User';
                        options.push({ label: `${sender}: "${contentSnippet}..."`, value: message.id! });
                    }
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
            return { disabled: false, options };
        },
    }),
    chatId: Property.Dropdown({
        displayName: 'Chat',
        refreshers: [],
        required: true,
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first.',
                    options: [],
                };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api('/chats').expand('members').get();
            while (response.value.length > 0) {
                for (const chat of response.value as Chat[]) {
                    const chatName = chat.topic || chat.members?.map((member: ConversationMember) => member.displayName).join(', ');
                    options.push({ label: `(${CHAT_TYPE[chat.chatType!]}) ${chatName || '(no title)'}`, value: chat.id! });
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
            return { disabled: false, options };
        },
    }),
    chatMessageId: Property.Dropdown({
        displayName: 'Message',
        description: 'The message from the chat.',
        refreshers: ['chatId'],
        required: true,
        options: async ({ auth, chatId }) => {
            if (!auth || !chatId) {
                return { disabled: true, placeholder: 'Please select a chat first.', options: [] };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api(`/chats/${chatId}/messages`).top(50).get();
            while (response.value.length > 0) {
                for (const message of response.value as ChatMessage[]) {
                    if (message.body?.content) {
                        const contentSnippet = message.body.content.replace(/<[^>]*>?/gm, '').substring(0, 100);
                        const sender = message.from?.user?.displayName || 'Unknown User';
                        options.push({ label: `${sender}: "${contentSnippet}..."`, value: message.id! });
                    }
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else { break; }
            }
            return { disabled: false, options: options };
        },
   }),
    userId: Property.Dropdown({
        displayName: 'User',
        description: 'The user to start a chat with.',
        refreshers: [],
        required: true,
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first.',
                    options: [],
                };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api('/users').top(100).get();
            while (response.value.length > 0) {
                for (const user of response.value as User[]) {
                    if(user.displayName && user.id) {
                        options.push({ label: user.displayName, value: user.id });
                    }
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
            return {
                disabled: false,
                options: options,
            };
        },
    }),
    channelOwnerId: Property.Dropdown({
        displayName: 'Channel Owner',
        description: 'The user who will be the initial owner of the private channel.',
        refreshers: [],
        required: true,
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Please connect your account first.',
                    options: [],
                };
            }
            const authValue = auth as PiecePropValueSchema<typeof microsoftTeamsAuth>;
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(authValue.access_token) },
            });
            const options: DropdownOption<string>[] = [];
            let response: PageCollection = await client.api('/users').top(100).get();
            while (response.value.length > 0) {
                for (const user of response.value as User[]) {
                    if(user.displayName && user.id) {
                        options.push({ label: user.displayName, value: user.id });
                    }
                }
                if (response['@odata.nextLink']) {
                    response = await client.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
            return {
                disabled: false,
                options: options,
            };
        },
    }),
};

const CHAT_TYPE: Record<string, string> = {
    oneOnOne: '1:1',
    group: 'Group',
    meeting: 'Meeting',
    unknownFutureValue: 'Unknown',
};