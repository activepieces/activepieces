import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common"
import { McpWithTools } from "@activepieces/shared"


export const agentMcp = {
    getMcp: async (params: McpParams) => {
        const response = await httpClient.sendRequest<McpWithTools>({
            method: HttpMethod.GET,
            url: `${params.publicUrl}v1/mcp-servers/${params.mcpId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: params.token,
            },
        })
        return response.body
    }
}   

type McpParams = {
    publicUrl: string
    token: string
    mcpId: string
}