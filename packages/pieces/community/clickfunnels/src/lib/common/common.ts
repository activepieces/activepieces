import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";


export const clickfunnelsAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: "Your ClickFunnels API Key. You can generate one in your account settings under 'API Keys'.",
    required: true,
});


export const clickfunnelsCommon = {
    // Base URL for the ClickFunnels API v2
    baseUrl: "https://api.clickfunnels.com/v2",

    
    funnelId: Property.Dropdown({
        displayName: 'Funnel',
        description: 'The funnel to associate the contact with.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your account first',
                    options: [],
                };
            }

            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `${clickfunnelsCommon.baseUrl}/funnels`,
                headers: {
                    'Authorization': `Bearer ${auth}`, // Using auth token as a Bearer token
                },
            };

            try {
                // Fetch the list of funnels from the API
                const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);
                const funnels = response.body.map((funnel) => {
                    return {
                        label: funnel.name,
                        value: funnel.id,
                    };
                });
                return {
                    disabled: false,
                    options: funnels,
                };
            } catch (error) {
                console.error("Error fetching funnels:", error);
                return {
                    disabled: true,
                    placeholder: "Error fetching funnels. Check API key and permissions.",
                    options: [],
                }
            }
        },
    }),
};