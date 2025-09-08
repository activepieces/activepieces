import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { agentxAuth } from "../common";


type Agent = {
    id: string;
    
};

export const newAgentTrigger = createTrigger({
    name: 'new_agent',
    auth: agentxAuth,
    displayName: 'New Agent',
    description: 'Triggers when a new AgentX agent is created.',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        id: "agt_1234567890abcdef",
        name: "Customer Support Bot",
        created_at: "2025-09-08T10:00:00Z"
    },

    
    async onEnable(context) {
        const agents = await getAgents(context.auth);
        const agentIds = agents.map(agent => agent.id);
        await context.store.put('agent_ids', agentIds);
    },

    
    async onDisable(context) {
        await context.store.put('agent_ids', []);
    },

    
    async run(context) {
        const lastRunAgentIds = (await context.store.get<string[]>('agent_ids')) ?? [];
        const lastRunAgentIdsSet = new Set(lastRunAgentIds);

        const currentAgents = await getAgents(context.auth);
        const newAgents: Agent[] = [];

        for (const agent of currentAgents) {
            if (!lastRunAgentIdsSet.has(agent.id)) {
                newAgents.push(agent);
            }
        }

        
        const currentAgentIds = currentAgents.map(agent => agent.id);
        await context.store.put('agent_ids', currentAgentIds);

        return newAgents;
    },

    
    async test(context) {
        const agents = await getAgents(context.auth);

        return agents.slice(0, 5);
    },
});


const getAgents = async (apiKey: string): Promise<Agent[]> => {
    const response = await httpClient.sendRequest<Agent[]>({
        method: HttpMethod.GET,
        url: `https://api.agentx.so/api/v1/access/agents`,
        headers: {
            'x-api-key': apiKey,
        },
    });
    return response.body;
};