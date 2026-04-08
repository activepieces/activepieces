import { Property } from "@activepieces/pieces-framework";
import { swarmnodeAuth } from "./auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "./constants";
import { ListAgentResponse } from "./types";

export const agentIdDropdown = Property.Dropdown({
    displayName: 'Agent',
    refreshers: [],
    auth: swarmnodeAuth,
    required: true,
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please authenticate first',
            };
        }

        const response = await httpClient.sendRequest<ListAgentResponse>({
            method: HttpMethod.GET,
            url: BASE_URL + '/agents/',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.secret_text
            }
        })

        return {
            disabled: false,
            options: response.body.results.map((agent) => ({
                label: agent.name,
                value: agent.id
            }))
        }


    }
})