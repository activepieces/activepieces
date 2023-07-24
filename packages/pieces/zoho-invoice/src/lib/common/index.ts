import { HttpMethod, httpClient } from "@activepieces/pieces-common"
import { OAuth2PropertyValue } from "@activepieces/pieces-framework"

export const common = {
    baseUrl: (region: string) => { return `https://www.zohoapis.${region}/invoice/v3` },
    authHeaders: (accessToken: string) => {
        return {
            'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
    },
    
    async getInvoices(auth: OAuth2PropertyValue, search: {
        createdTime: string
    }) {
        const response = await httpClient.sendRequest({
            url: `${common.baseUrl(auth.props!['region'])}/invoices`,
            method: HttpMethod.GET,
            headers: common.authHeaders(auth.access_token),
            queryParams: {
                date: search.createdTime
            }
        });

        return response.body['invoices'];
    }
}