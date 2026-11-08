export enum PrincipalType {
    USER = 'USER',
    ENGINE = 'ENGINE',
    SERVICE = 'SERVICE',
    WORKER = 'WORKER',
    UNKNOWN = 'UNKNOWN',
    ONBOARDING = 'ONBOARDING',
    CREDENTIAL_PROXY = 'CREDENTIAL_PROXY',
}

export const ALL_PRINCIPAL_TYPES: PrincipalType[] = Object.values(PrincipalType).filter((type) => type !== PrincipalType.CREDENTIAL_PROXY)

export const SERVICE_KEY_SECURITY_OPENAPI = {
    apiKey: [],
}

export enum EndpointScope {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}
