import { Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const linkedinCommon = {
    baseUrl: 'https://api.linkedin.com/v2',
    linkedinHeaders: {
        'X-Restli-Protocol-Version': '2.0.0'
    },

    authentication: Property.OAuth2({
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        displayName: 'Authentication',
        required: true,
        scope: ['w_member_social']
    })
}