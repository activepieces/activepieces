import { AuthenticationType, HttpMessageBody, HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common"
import { Folder, FolderCreateRequest, FolderCreateResponse, FolderGetRequest, FolderHierarchy, FolderListRequest } from "./models/folder"
import { ActionResponse, prepareQueryRequest } from "./models/common"

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

    async createFolder(request: FolderCreateRequest): Promise<FolderCreateResponse> {
        return await this.makeRequest(HttpMethod.POST, '/folder', undefined, request)
    }

    async listFolders(request: FolderListRequest): Promise<Folder[]> {
        return await this.makeRequest(HttpMethod.GET, '/folder', prepareQueryRequest(request))
    }

    async getFolder(id: string, request?: FolderGetRequest): Promise<Folder> {
        return await this.makeRequest(HttpMethod.GET, '/folder/' + id, prepareQueryRequest(request))
    }

    async getFolderHierarchy(parentId?: string): Promise<FolderHierarchy[]> {
        const folders = await this.listFolders({
            page_size: 99999,
            filter: {
                parent: parentId || 'null'
            }
        })
        const hierarchies: FolderHierarchy[] = []
        for(const folder of folders) {
            hierarchies.push({
                id: folder.id,
                name: folder.name,
                children: (await this.getFolderHierarchy(folder.id))
            })
        }
        return hierarchies
    }

    async deleteFolder(id: string): Promise<ActionResponse> {
        return await this.makeRequest(HttpMethod.DELETE, '/folder/' + id)
    }

}