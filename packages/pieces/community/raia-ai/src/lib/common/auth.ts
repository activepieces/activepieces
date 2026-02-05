import { PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "./constants";

export const raiaAiAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: `
    1. Open your agent in raiaAI Launch Pad and go to Agent → Skills.
    2. Add/enable “API Skill” (toggle it Active).
    3. In the API Skill settings, click “Generate Secret Key” (your agent’s API key).`,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: BASE_URL + '/agents/by-api-key',
                headers: {
                    'Agent-Secret-Key': auth
                }
            })

            return {
                valid: true
            }
        }
        catch {
            return {
                valid: false,
                error: 'Invalid API Key.'
            }
        }
    }
})