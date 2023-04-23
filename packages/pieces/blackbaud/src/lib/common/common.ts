import { Property } from "@activepieces/pieces-framework";

export const blackbaudCommon = {
    baseUrl: "https://api.sky.blackbaud.com",
    auth_props: {
        authentication: Property.OAuth2({
            description: "",
            displayName: 'Authentication',
            authUrl: "https://app.blackbaud.com/oauth/authorize",
            tokenUrl: "https://oauth2.sky.blackbaud.com/token",
            required: true,
            scope: []
        }),
        subscription_key: Property.ShortText({
            displayName: "Subscription Key",
            required: true
        })
    }
}
