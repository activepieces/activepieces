import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework'
import { BaseOAuth2ConnectionValue } from '@activepieces/shared'

export type OAuth2Service<CONNECTION_VALUE extends BaseOAuth2ConnectionValue> =  {
    claim(request: ClaimOAuth2Request): Promise<CONNECTION_VALUE>
    refresh(request: RefreshOAuth2Request<CONNECTION_VALUE>): Promise<CONNECTION_VALUE>
}

export type RefreshOAuth2Request<T extends BaseOAuth2ConnectionValue> = {
    pieceName: string
    projectId: string
    connectionValue: T
}

export type ClaimOAuth2Request = {
    projectId: string
    pieceName: string
    request: {
        code: string
        clientId: string
        tokenUrl: string
        clientSecret?: string
        redirectUrl?: string
        authorizationMethod?: OAuth2AuthorizationMethod
        codeVerifier?: string
    }
}

