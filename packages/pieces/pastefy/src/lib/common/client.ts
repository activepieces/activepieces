import { AuthenticationType, HttpMessageBody, HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common"

export class PastefyClient {

    constructor(private apiKey: string, private instanceUrl = 'https://pastefy.app') {}

    async makeRequest<T extends HttpMessageBody>(method: HttpMethod, url: string, query?: QueryParams, body?: object): Promise<T> {
        const res = await httpClient.sendRequest<T>({
            method,
            url: this.instanceUrl + '/api/v2' + url,
            queryParams: query,
            body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: this.apiKey
            }
        })
        return res.body
    }

}