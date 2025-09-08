import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { agentxAuth } from "../common";
import { agentIdDropdown } from "../common/props";

type Conversation = {
    id: string;
    // Add other expected conversation properties here
};

export const newConversationTrigger = createTrigger({
    name: 'new_conversation',
    auth: agentxAuth,
    displayName: 'New Conversation',
    description: 'Triggers when a new conversation begins with a specific agent.',
    type: TriggerStrategy.POLLING,
    props: {
        agentId: agentIdDropdown
    },
    sampleData: {
        id: "conv_1234567890abcdef",
        type: "chat",
        created_at: "2025-09-08T11:45:00Z"
    },

    async onEnable(context) {
        const conversations = await getConversations(context.auth, context.propsValue.agentId);
        const conversationIds = conversations.map(conv => conv.id);
        await context.store.put(getStoreKey(context.propsValue.agentId), conversationIds);
    },

    async onDisable(context) {
        await context.store.put(getStoreKey(context.propsValue.agentId), []);
    },

    async run(context) {
        const agentId = context.propsValue.agentId;
        const storeKey = getStoreKey(agentId);

        const lastRunConvIds = (await context.store.get<string[]>(storeKey)) ?? [];
        const lastRunConvIdsSet = new Set(lastRunConvIds);
        
        const currentConversations = await getConversations(context.auth, agentId);
        const newConversations: Conversation[] = [];

        for (const conv of currentConversations) {
            if (!lastRunConvIdsSet.has(conv.id)) {
                newConversations.push(conv);
            }
        }

        const currentConvIds = currentConversations.map(conv => conv.id);
        await context.store.put(storeKey, currentConvIds);

        return newConversations;
    },

    async test(context) {
        const conversations = await getConversations(context.auth, context.propsValue.agentId);
        return conversations.slice(0, 5);
    },
});

const getStoreKey = (agentId: string) => `conversation_ids_${agentId}`;

const getConversations = async (apiKey: string, agentId: string): Promise<Conversation[]> => {
    const response = await httpClient.sendRequest<Conversation[]>({
        method: HttpMethod.GET,
        url: `https://api.agentx.so/api/v1/access/agents/${agentId}/conversations`,
        headers: {
            'x-api-key': apiKey,
        },
    });
    return response.body;
};