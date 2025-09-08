import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
} from "@activepieces/pieces-framework";
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
    HttpMethod,
    httpClient,
} from "@activepieces/pieces-common";
import dayjs from "dayjs"; 
import { agentxAuth } from "../common";
import { agentIdDropdown } from "../common/props";


type Conversation = {
    id: string;
    created_at: string; 
    [key: string]: unknown;
};


const polling: Polling<
    string,
    { agentId: string }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
        const agentId = propsValue.agentId;

        
        if (!agentId) {
            return [];
        }

        const response = await httpClient.sendRequest<Conversation[]>({
            method: HttpMethod.GET,
            url: `https://api.agentx.so/api/v1/access/agents/${agentId}/conversations`,
            headers: {
                'x-api-key': auth,
            },
        });

        const conversations = response.body || [];

       
        return conversations.map((conv) => ({
            epochMilliSeconds: dayjs(conv.created_at).valueOf(),
            data: conv,
        }));
    },
};

export const newConversationTrigger = createTrigger({
    name: 'new_conversation',
    auth: agentxAuth,
    displayName: 'New Conversation',
    description: 'Triggers when a new conversation begins with a specific agent.',
    type: TriggerStrategy.POLLING,
    props: {
        agentId: agentIdDropdown,
    },
    sampleData: {
        id: "conv_1234567890abcdef",
        type: "chat",
        created_at: "2025-09-08T11:45:00Z",
    },
    
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});