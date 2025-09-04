import { PiecePropValueSchema, createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { Polling, pollingHelper, DedupeStrategy, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

// Define the structure of a single message from the API response.
interface Message {
    content: string;
    type: 'user' | 'bot';
    createdAt: string;
}

// Define the polling logic using the pollingHelper structure.
const polling: Polling<PiecePropValueSchema<typeof wonderchatAuth>, { chatlogId: string }> = {
    // Use a time-based strategy to avoid sending duplicate messages.
    strategy: DedupeStrategy.TIMEBASED,
    // The items function is the core of the polling logic.
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

        // Filter for messages that are from the user and are new since the last fetch.
        const newMessages = messages
            .filter(message => message.type === 'user')
            .filter(message => new Date(message.createdAt).getTime() > lastFetchEpochMS);
        
        // Map the new messages to the format required by the polling helper.
        return newMessages.map((message) => ({
            // The epochMilliSeconds is used for the time-based deduplication.
            epochMilliSeconds: new Date(message.createdAt).getTime(),
            // The data is the payload that will be sent to the workflow.
            data: {
                ...message,
                chatlogId: propsValue.chatlogId, // Add chatlogId for context
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

    // The following methods are boilerplate that delegate to the pollingHelper.
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },

    async onEnable(context) {
        // FIX: Removed 'files' from onEnable as it's not an expected property.
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async onDisable(context) {
        // FIX: Removed 'files' from onDisable as it's not an expected property.
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

