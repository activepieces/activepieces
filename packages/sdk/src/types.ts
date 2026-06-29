export type ApSdkClientConfig = {
    apiKey: string
    instanceUrl: string
}

export type ConnectionStatus = 'ACTIVE' | 'MISSING' | 'ERROR'

export type ConnectionAuthType =
    | 'SECRET_TEXT'
    | 'BASIC_AUTH'
    | 'CUSTOM_AUTH'
    | 'OAUTH2'
    | 'CLOUD_OAUTH2'
    | 'PLATFORM_OAUTH2'
    | 'OIDC'
    | 'NO_AUTH'

export type SdkProject = {
    id: string
    displayName: string
    externalId?: string | null
}

export type SdkConnection = {
    id: string
    externalId: string
    displayName: string
    pieceName: string
    status: ConnectionStatus
}

export type SdkPieceSummary = {
    name: string
    displayName: string
    description?: string
    logoUrl?: string
}

export type ListPiecesParams = {
    searchQuery?: string
}

export type ListConnectionsParams = {
    pieceName?: string
    displayName?: string
    status?: ConnectionStatus[]
}

export type GetPiecePropsParams = {
    pieceName: string
    actionName: string
    type?: 'action' | 'trigger'
    /** Connection externalId — when provided, dynamic dropdown options are resolved. */
    auth?: string
    input?: Record<string, unknown>
}

export type RunActionParams = {
    pieceName: string
    actionName: string
    pieceVersion?: string
    props?: Record<string, unknown>
    connectionExternalId?: string
}

export type RunActionResult = {
    text: string
    structuredContent?: Record<string, unknown>
    isError: boolean
}

export type CreateCredentialConnectionParams = {
    externalId: string
    displayName?: string
    type: ConnectionAuthType
    value: Record<string, unknown>
}

export type CreateConnectLinkParams = {
    externalId: string
    displayName?: string
}

export type ConnectLinkRequest = {
    redirectUrl: string
    externalId: string
    expiresAt: string
    waitForConnection: (options?: { timeoutMs?: number, pollIntervalMs?: number }) => Promise<SdkConnection>
}
