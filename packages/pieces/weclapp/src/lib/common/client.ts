import { HttpMessageBody, HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common"

interface Result {
    result: any
}

export class WeClappClient {

    constructor(private tenant: string, private token: string) {}

    async makeRequest<T extends HttpMessageBody>(method: HttpMethod, url: string, query?: QueryParams, body?: object): Promise<T> {
        const res = await httpClient.sendRequest<T>({
            method,
            url: `https://${this.tenant}.weclapp.com/webapp/api/v1/${url}`,
            queryParams: query,
            body,
            headers: {
                'AuthenticationToken': this.token
            }
        })
        return res.body
    }

    async list(entityType: string): Promise<any[]> {
        const res = await this.makeRequest<Result>(HttpMethod.GET, `/${entityType}`)
        return res.result
    }

    async create(entityType: string, body: Record<string, any>): Promise<any> {
        const res = await this.makeRequest<any>(HttpMethod.POST, `/${entityType}`, undefined, body)
        return res
    }

    async getById(entityType: string, id: string): Promise<any> {
        const res = await this.makeRequest<any>(HttpMethod.GET, `/${entityType}/id/${id}`)
        return res
    }

    async update(entityType: string, id: string, body: Record<string, any>): Promise<any> {
        const res = await this.makeRequest<any>(HttpMethod.PUT, `/${entityType}/id/${id}`, undefined, body)
        return res
    }

    async delete(entityType: string, id: string) {
        await this.makeRequest(HttpMethod.DELETE, `/${entityType}/id/${id}`)
    }

}