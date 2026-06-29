import { HttpClient } from './http'
import { buildMetaTools, SdkTool } from './tools/meta-tools'
import {
    ConnectLinkRequest,
    CreateConnectLinkParams,
    CreateCredentialConnectionParams,
    GetPiecePropsParams,
    ListConnectionsParams,
    ListPiecesParams,
    RunActionParams,
    RunActionResult,
    SdkConnection,
    SdkPieceSummary,
} from './types'

export function createProjectSession({ http, projectId }: { http: HttpClient, projectId: string }): ProjectSession {
    const connections = {
        async list(params: ListConnectionsParams = {}): Promise<SdkConnection[]> {
            const page = await http.get<SeekPage<SdkConnection>>('/v1/app-connections', {
                query: {
                    projectId,
                    pieceName: params.pieceName,
                    displayName: params.displayName,
                    status: params.status,
                    limit: 200,
                },
            })
            return page.data
        },
        async get(externalId: string): Promise<SdkConnection | undefined> {
            const all = await connections.list({})
            return all.find((connection) => connection.externalId === externalId)
        },
        async createWithCredentials(pieceName: string, params: CreateCredentialConnectionParams): Promise<SdkConnection> {
            return http.post<SdkConnection>('/v1/app-connections', {
                body: {
                    projectId,
                    pieceName,
                    externalId: params.externalId,
                    displayName: params.displayName ?? params.externalId,
                    type: params.type,
                    value: params.value,
                },
            })
        },
        async createLink(pieceName: string, params: CreateConnectLinkParams): Promise<ConnectLinkRequest> {
            const link = await http.post<{ redirectUrl: string, externalId: string, expiresAt: string }>('/v1/sdk/connect/links', {
                body: {
                    projectId,
                    pieceName,
                    externalId: params.externalId,
                    displayName: params.displayName,
                },
            })
            return {
                ...link,
                waitForConnection: (options) => waitForConnection({ getConnection: () => connections.get(params.externalId), ...options }),
            }
        },
        async delete(id: string): Promise<void> {
            await http.delete(`/v1/app-connections/${id}`)
        },
    }

    const pieces = {
        async list(params: ListPiecesParams = {}): Promise<SdkPieceSummary[]> {
            return http.get<SdkPieceSummary[]>('/v1/pieces', {
                query: { searchQuery: params.searchQuery },
            })
        },
        async get(name: string): Promise<unknown> {
            return http.get(`/v1/pieces/${name}`)
        },
        async getProps(params: GetPiecePropsParams): Promise<McpToolResult> {
            return http.post<McpToolResult>('/v1/sdk/pieces/props', {
                body: {
                    projectId,
                    pieceName: params.pieceName,
                    actionOrTriggerName: params.actionName,
                    type: params.type ?? 'action',
                    auth: params.auth,
                    input: params.input,
                },
            })
        },
    }

    const actions = {
        async run(params: RunActionParams): Promise<RunActionResult> {
            const result = await http.post<McpToolResult>('/v1/sdk/actions/run', {
                body: {
                    projectId,
                    pieceName: params.pieceName,
                    pieceVersion: params.pieceVersion,
                    actionName: params.actionName,
                    input: params.props,
                    connectionExternalId: params.connectionExternalId,
                },
            })
            return {
                text: result.content.map((part) => part.text).join('\n'),
                structuredContent: result.structuredContent,
                isError: result.isError ?? false,
            }
        },
    }

    const session: ProjectSession = {
        projectId,
        connections,
        pieces,
        actions,
        tools: () => buildMetaTools(session),
    }
    return session
}

async function waitForConnection({ getConnection, timeoutMs = 120_000, pollIntervalMs = 2_000 }: {
    getConnection: () => Promise<SdkConnection | undefined>
    timeoutMs?: number
    pollIntervalMs?: number
}): Promise<SdkConnection> {
    const deadline = Date.now() + timeoutMs
    for (;;) {
        const connection = await getConnection()
        if (connection !== undefined && connection.status === 'ACTIVE') {
            return connection
        }
        if (Date.now() >= deadline) {
            throw new Error('Timed out waiting for the connection to become active.')
        }
        await delay(pollIntervalMs)
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

type SeekPage<T> = {
    data: T[]
    next: string | null
    previous: string | null
}

type McpToolResult = {
    content: Array<{ type: 'text', text: string }>
    structuredContent?: Record<string, unknown>
    isError?: boolean
}

export type ProjectSession = {
    projectId: string
    connections: {
        list: (params?: ListConnectionsParams) => Promise<SdkConnection[]>
        get: (externalId: string) => Promise<SdkConnection | undefined>
        createWithCredentials: (pieceName: string, params: CreateCredentialConnectionParams) => Promise<SdkConnection>
        createLink: (pieceName: string, params: CreateConnectLinkParams) => Promise<ConnectLinkRequest>
        delete: (id: string) => Promise<void>
    }
    pieces: {
        list: (params?: ListPiecesParams) => Promise<SdkPieceSummary[]>
        get: (name: string) => Promise<unknown>
        getProps: (params: GetPiecePropsParams) => Promise<McpToolResult>
    }
    actions: {
        run: (params: RunActionParams) => Promise<RunActionResult>
    }
    /** The fixed Composio-style meta-tool set for agent frameworks. */
    tools: () => SdkTool[]
}
