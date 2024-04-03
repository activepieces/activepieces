import {
    ClaimOAuth2Request,
    OAuth2Service,
    RefreshOAuth2Request,
} from '../../app-connection/app-connection-service/oauth2/oauth2-service'
import { credentialsOauth2Service } from '../../app-connection/app-connection-service/oauth2/services/credentials-oauth2-service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { OAuthAppWithSecret } from '../oauth-apps/oauth-app.entity'
import { oauthAppService } from '../oauth-apps/oauth-app.service'
import { PropertyType } from '@activepieces/pieces-framework'
import {
    AppConnectionType,
    assertNotNullOrUndefined,
    isNil,
    PlatformOAuth2ConnectionValue,
} from '@activepieces/shared'

export const platformOAuth2Service: OAuth2Service<PlatformOAuth2ConnectionValue> =
  {
      claim,
      refresh,
  }

async function refresh({
    pieceName,
    projectId,
    connectionValue,
}: RefreshOAuth2Request<PlatformOAuth2ConnectionValue>): Promise<PlatformOAuth2ConnectionValue> {
    const oauth2App = await getApp({
        pieceName,
        clientId: connectionValue.client_id,
        projectId,
    })
    const newValue = await credentialsOauth2Service.refresh({
        pieceName,
        projectId,
        connectionValue: {
            ...connectionValue,
            type: AppConnectionType.OAUTH2,
            client_secret: oauth2App.clientSecret,
        },
    })
    return {
        expires_in: newValue.expires_in,
        client_id: newValue.client_id,
        token_type: newValue.token_type,
        access_token: newValue.access_token,
        claimed_at: newValue.claimed_at,
        refresh_token: newValue.refresh_token,
        redirect_url: newValue.redirect_url,
        scope: newValue.scope,
        token_url: newValue.token_url,
        data: newValue.data,
        props: newValue.props,
        authorization_method: newValue.authorization_method,
        type: AppConnectionType.PLATFORM_OAUTH2,
    }
}

async function claim({
    request,
    projectId,
    pieceName,
}: ClaimOAuth2Request): Promise<PlatformOAuth2ConnectionValue> {
    const { auth } = await pieceMetadataService.getOrThrow({
        name: pieceName,
        version: undefined,
        projectId,
    })
    if (isNil(auth) || auth.type !== PropertyType.OAUTH2) {
        throw new Error(
            'Cannot claim auth for non oauth2 property ' +
        auth?.type +
        ' ' +
        pieceName,
        )
    }
    const oauth2App = await getApp({
        pieceName,
        clientId: request.clientId,
        projectId,
    })

    const claimedValue = await credentialsOauth2Service.claim({
        request: {
            ...request,
            clientId: oauth2App.clientId,
            clientSecret: oauth2App.clientSecret,
        },
        projectId,
        pieceName,
    })
    return {
        ...claimedValue,
        type: AppConnectionType.PLATFORM_OAUTH2,
    }
}

async function getApp({
    pieceName,
    clientId,
    projectId,
}: {
    clientId: string
    pieceName: string
    projectId: string
}): Promise<OAuthAppWithSecret> {
    const project = await projectService.getOne(projectId)
    const platformId = project?.platformId
    assertNotNullOrUndefined(platformId, 'Platform id is not defined')
    return oauthAppService.getWithSecret({
        pieceName,
        clientId,
        platformId,
    })
}
