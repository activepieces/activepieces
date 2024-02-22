export enum PrincipalType {
    USER = 'USER',
    WORKER = 'WORKER',
    SERVICE = 'SERVICE',
    UNKNOWN = 'UNKNOWN',
    SUPER_USER = 'SUPER_USER',
}

export const ALL_PRINICPAL_TYPES = Object.values(PrincipalType)

export const SERVICE_KEY_SECURITY_OPENAPI = {
    apiKey: [],
}

export enum EndpointScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum PlatformRole {
    OWNER = 'OWNER',
    MEMBER = 'MEMBER',
}
