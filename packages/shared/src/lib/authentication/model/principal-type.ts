export enum PrincipalType {
    USER = 'USER',
    WORKER = 'WORKER',
    SERVICE = 'SERVICE',
    UNKNOWN = 'UNKNOWN',

    /**
     * @deprecated
     */
    SUPER_USER = 'SUPER_USER',
}

export const ALL_PRINCIPAL_TYPES = Object.values(PrincipalType)

export const SERVICE_KEY_SECURITY_OPENAPI = {
    apiKey: [],
}

export enum EndpointScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}
