function isExternalClient({ clientId }: { clientId: string }): boolean {
    return clientId !== INTERNAL_CHAT_CLIENT_ID
}

export const INTERNAL_CHAT_CLIENT_ID = 'internal-chat'

export const mcpClients = { isExternalClient }
