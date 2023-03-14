import { AuthenticationType, httpClient, HttpMethod, Property } from "@activepieces/framework";

export const intercomCommon = {
    connection: Property.OAuth2({
        authUrl: 'https://app.intercom.com/oauth',
        tokenUrl: 'https://api.intercom.io/auth/eagle/token',
        displayName: 'Connection',
        required: true,
        scope: []
    }),
    intercomHeaders: {
        "Intercom-Version": "2.8"
    },
    getContact: async (req: { userId: string, token: string }) => {
        return (await httpClient.sendRequest<{ id: string, role: string }>({
            method: HttpMethod.GET,
            url: `https://api.intercom.io/contacts/${req.userId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: (req.token as string)
            },
        })).body;
    }

}