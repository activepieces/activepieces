import { AuthenticationType, DedupeStrategy, HttpMessageBody, HttpMethod, HttpRequest, Polling, httpClient, pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import dayjs from 'dayjs'


interface Message {
    id: string;
    type: number;
    content: string;
    channel_id: string;
    author: {
        id: string;
        username: string;
    };
    attachments: any;
    embeds: any;
    mentions: any;
    mention_roles: any;
    pinned: boolean;
    mention_everyone: boolean;
    tts: boolean;
    timestamp: string;
    edited_timestamp: string | null;
    flags: number;
    components: any;
}

const polling: Polling<{ channelId: string, limit: number, token: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue }) => {
        
        const request: HttpRequest<{ channelId: string, limit: number, token: string}> = {
            method: HttpMethod.GET,
            url: "https://discord.com/api/v9/channels/" + propsValue.channelId + "/messages?limit=" + propsValue.limit,
            headers: {
                "Authorization": "Bot " + propsValue.token,
            }
        };

        const res = await httpClient.sendRequest<Message[]>(request);
        
        const items = res.body;
        return items.map((item) => ({
            epochMilliSeconds: dayjs(item.timestamp).valueOf(),
            data: item,
        }));
    }
}

export const onMesssage = createTrigger({
    name: 'on_message',
    displayName: 'On message',
    description: 'Triggers when a message is sent in a channel',
    type: TriggerStrategy.POLLING,
    props: {
        token: Property.SecretText({
            displayName: 'Token',
            description: "The bot token",
            required: true,
        }),
        channelId: Property.ShortText({
            displayName: 'Channel ID',
            description: "The channel ID to listen to",
            required: true,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: "The number of messages to fetch",
            required: true,
            defaultValue: 50
        }) 
    },
    sampleData: {},
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    }
});