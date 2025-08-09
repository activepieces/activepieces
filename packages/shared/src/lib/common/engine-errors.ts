// Engine error constants for connection-related failures
export const ENGINE_ERROR_NAMES = {
    CONNECTION_EXPIRED: 'ConnectionExpired',
    CONNECTION_NOT_FOUND: 'ConnectionNotFound',
    CONNECTION_LOADING_FAILURE: 'ConnectionLoadingFailure',
} as const

export type EngineErrorName = typeof ENGINE_ERROR_NAMES[keyof typeof ENGINE_ERROR_NAMES]