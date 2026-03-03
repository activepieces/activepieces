import { OAuth2GrantType } from '../../../automation/app-connection/dto/upsert-app-connection-request'
import { ProjectId } from '../../../management/project/project'

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
    id: AppCredentialId
    created: string
    updated: string
    appName: string
    projectId: ProjectId
    settings: AppOAuth2Settings | AppApiKeySettings
}

export enum AppCredentialType {
    OAUTH2 = 'OAUTH2',
    API_KEY = 'API_KEY',
}


