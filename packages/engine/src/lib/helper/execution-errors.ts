export class ConnectionNotFoundError extends Error {
    constructor(connectionName: string) {
        super(`connection (${connectionName}) not found`)
        this.name = 'ConnectionNotFound'
    }
}

export class ConnectionLoadingFailureError extends Error {
    constructor(connectionName: string, url: string) {
        super(`Failed to load connection (${connectionName}) from ${url}`)
        this.name = 'ConnectionLoadingFailure'
    }
}
