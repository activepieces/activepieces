import { FastifyInstance, InjectOptions } from 'fastify'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from './mcp-oauth'

async function connect({ app, approve, projectId }: ConnectParams): Promise<McpClient> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()

    const consent = await app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            scope: 'mcp',
            resource: projectId ? PROJECT_RESOURCE : PLATFORM_RESOURCE,
        }).toString(),
    })

    const authRequestId = new URL(String(consent.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
    const approved = await approve({
        authRequestId,
        ...(projectId ? { projectId } : {}),
    })

    const code = new URL(approved.json().redirectUrl).searchParams.get('code') ?? ''
    const token = await app.inject({
        method: 'POST',
        url: '/token',
        payload: {
            grant_type: 'authorization_code',
            client_id: client.client_id,
            code,
            code_verifier: verifier,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
        },
    })

    return {
        accessToken: token.json().access_token,
        endpoint: projectId ? '/mcp' : '/mcp/platform',
    }
}

async function callTool({ app, mcpClient, name, args }: CallToolParams): Promise<string> {
    const message = await rpc({
        app,
        mcpClient,
        body: { method: 'tools/call', params: { name, arguments: args ?? {} } },
    })
    return (message.result?.content ?? []).map((part) => part.text ?? '').join('\n')
}

async function listToolNames({ app, mcpClient }: { app: FastifyInstance, mcpClient: McpClient }): Promise<string[]> {
    const message = await rpc({
        app,
        mcpClient,
        body: { method: 'tools/list', params: {} },
    })
    return (message.result?.tools ?? []).map((tool) => tool.name)
}

async function rpc({ app, mcpClient, body }: RpcParams): Promise<JsonRpcResponse> {
    const inject: InjectOptions = {
        method: 'POST',
        url: mcpClient.endpoint,
        headers: {
            'authorization': `Bearer ${mcpClient.accessToken}`,
            'content-type': 'application/json',
            'accept': 'application/json, text/event-stream',
        },
        payload: { jsonrpc: '2.0', id: 1, ...body },
    }
    const res = await app.inject(inject)
    const dataLine = res.body.split('\n').find((line) => line.startsWith('data: '))
    return JSON.parse(dataLine ? dataLine.slice('data: '.length) : res.body)
}

export const mcpClientHelpers = {
    connect,
    callTool,
    listToolNames,
}

export const PLATFORM_RESOURCE = 'https://cloud.activepieces.com/mcp/platform'
export const PROJECT_RESOURCE = 'https://cloud.activepieces.com/mcp'

export type McpClient = {
    accessToken: string
    endpoint: string
}

type ApproveRequest = (payload: { authRequestId: string, projectId?: string }) => ReturnType<FastifyInstance['inject']>

type ConnectParams = {
    app: FastifyInstance
    approve: ApproveRequest
    projectId?: string
}

type CallToolParams = {
    app: FastifyInstance
    mcpClient: McpClient
    name: string
    args?: Record<string, unknown>
}

type RpcParams = {
    app: FastifyInstance
    mcpClient: McpClient
    body: { method: string, params: Record<string, unknown> }
}

type JsonRpcResponse = {
    result?: {
        content?: Array<{ type: string, text?: string }>
        tools?: Array<{ name: string }>
    }
}
