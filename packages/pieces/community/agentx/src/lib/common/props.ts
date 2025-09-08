import { Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

// Helper function to fetch agents, can be used by the dropdown
const getAgents = async (apiKey: string): Promise<{ id: string; name: string; }[]> => {
    const response = await httpClient.sendRequest<{ id: string; name: string; }[]>({
        method: HttpMethod.GET,
        url: `https://api.agentx.so/api/v1/access/agents`,
        headers: {
            'x-api-key': apiKey,
        },
    });
    return response.body;
};

export const agentIdDropdown = Property.Dropdown({
    displayName: 'Agent',
    description: 'The agent to monitor.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Please authenticate first.',
                options: [],
            };
        }
        const agents = await getAgents(auth as string);
        return {
            disabled: false,
            options: agents.map((agent) => {
                return {
                    label: agent.name,
                    value: agent.id,
                };
            }),
        };
    },
});