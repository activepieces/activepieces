import { PiecePropValueSchema, createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { Polling, pollingHelper, DedupeStrategy, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";


interface Message {
    content: string;
    type: 'user' | 'bot';
    createdAt: string;
}


const polling: Polling<PiecePropValueSchema<typeof wonderchatAuth>, { chatlogId: string }> = {
    
    strategy: DedupeStrategy.TIMEBASED,
    
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const response = await httpClient.sendRequest<{ messages: Message[] }>({
            method: HttpMethod.POST,
            url: `https://app.wonderchat.io/api/v1/messages`,
            body: {
                apiKey: auth.apiKey,
                chatlogId: propsValue.chatlogId,
            }
        });

        const messages = response.body.messages;

        
        const newMessages = messages
            .filter(message => message.type === 'user')
            .filter(message => new Date(message.createdAt).getTime() > lastFetchEpochMS);
        
        
        return newMessages.map((message) => ({
            
            epochMilliSeconds: new Date(message.createdAt).getTime(),
            
            data: {
                ...message,
                chatlogId: propsValue.chatlogId, 
            }
        }));
    },
};

export const newUserMessage = createTrigger({
    auth: wonderchatAuth,
    name: 'new_user_message',
    displayName: 'New User Message',
    description: 'Triggers when a new message is sent by a user in a specific chatlog.',
    props: {
        chatlogId: Property.ShortText({
            displayName: 'Chatlog ID',
            description: "The ID of the chatlog to monitor for new user messages.",
            required: true,
        }),
    },
    sampleData: {
        content: "I have a question about your product.",
        type: "user",
        createdAt: "2023-12-01T06:35:10.123Z",
        chatlogId: "cli7n0vvs000008l43ez2bxa0"
    },
    type: TriggerStrategy.POLLING,

    
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },

    async onEnable(context) {
        
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async onDisable(context) {
        
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async run(context) {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
});

