import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { AgentXAuth } from "../common";

export const searchAgents = createAction({
    name: 'search_agents',
    auth: AgentXAuth,
    displayName: 'Search Agents',
    description: 'Finds an agent by its ID or name.',
    props: {
        searchTerm: Property.ShortText({
            displayName: 'Search Term (ID or Name)',
            description: 'The ID or name of the agent to find. Leave blank to retrieve all agents.',
            required: false,
        }),
    },
    async run(context) {
        const { searchTerm } = context.propsValue;
        const apiKey = context.auth;

        const response = await httpClient.sendRequest<any[]>({
            method: HttpMethod.GET,
            url: `https://api.agentx.so/api/v1/access/agents`,
            headers: {
                'x-api-key': apiKey,
            },
        });

        const allAgents = response.body;

       
        if (!searchTerm) {
            return allAgents;
        }

        
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filteredAgents = allAgents.filter(agent =>
            (agent.name && agent.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (agent.id && agent.id.toLowerCase().includes(lowerCaseSearchTerm))
        );

        return filteredAgents;
    },
});