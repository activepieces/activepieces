import { PieceAuth } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common"
import { BASE_URL } from "./constants";

export const leexiAuth = PieceAuth.BasicAuth({
    required: true,
    description: `You can obtain Key ID and secret from [API Keys Settings](https://app.leexi.ai/en/settings/api_keys).`,
    username: {
        displayName: 'Key ID',
    },
    password: {
        displayName: 'Key Secret'
    },
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: BASE_URL + '/users',
                authentication: {
                    type: AuthenticationType.BASIC,
                    username: auth.username,
                    password: auth.password
                }
            })

            return {
                valid: true
            }

        }
        catch {
            return {
                valid: false,
                error: 'Invalid Credentials'
            }
        }
    }
})