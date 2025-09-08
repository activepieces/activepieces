import { Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

type Agent = {
    _id: string;
    name: string;
};

const getAgents = async (apiKey: string): Promise<Agent[]> => {
    const timestamp = Date.now();
    const response = await httpClient.sendRequest<Agent[]>({
        method: HttpMethod.GET,
        url: `https://api.agentx.so/api/v1/access/agents?timestamp=${timestamp}`,
        headers: {
            'x-api-key': apiKey,
        },
    });
    return response.body || [];
};

export const agentIdDropdown = Property.Dropdown({
    displayName: 'Agent',
    description: 'The agent to monitor.',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first.',
                options: [],
            };
        }
        
        try {
            const agents = await getAgents(auth as string);
            
            if (agents.length === 0) {
                return {
                    disabled: true,
                    placeholder: 'No agents found in your account.',
                    options: [],
                };
            }

            return {
                disabled: false,
                options: agents.map((agent) => ({
                    label: agent.name,
                    value: agent._id, 
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                placeholder: `Error fetching agents: ${error}`,
                options: [],
            };
        }
    },
});