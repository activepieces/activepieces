import { BaseModel, OAuth2GrantType, ProjectId } from '@activepieces/shared'

export type AppCredentialId = string

export type AppOAuth2Settings = {
    type: AppCredentialType.OAUTH2
    authUrl: string
    tokenUrl: string
    grantType: OAuth2GrantType
    clientId: string
    clientSecret?: string
    scope: string
}

export type AppApiKeySettings = {
    type: AppCredentialType.API_KEY
}
export type AppCredential = {
    appName: string
    projectId: ProjectId
    settings: AppOAuth2Settings | AppApiKeySettings
} & BaseModel<AppCredentialId>

export enum AppCredentialType {
    OAUTH2 = 'OAUTH2',
    API_KEY = 'API_KEY',
}


