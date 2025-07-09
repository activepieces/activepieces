import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const klaviyoAuth = PieceAuth.CustomAuth({

    description: 'Enter custom authentication details',
    props: {
        api_key: Property.ShortText({
            displayName: 'Klaviyo API Key',
            description: '',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth.api_key, HttpMethod.GET, '/accounts', {});
                return {
                    valid: true,
                }
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid Api Key'
                }
            }

        }
        return {
            valid: false,
            error: 'Invalid Api Key'
        }

    },
    required: true
})