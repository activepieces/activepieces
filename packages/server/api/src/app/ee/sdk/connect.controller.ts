import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import {
    AppConnectionScope,
    AppConnectionStatus,
    AppConnectionType,
    AppConnectionWithoutSensitiveData,
    ConnectOAuth2UrlRequest,
    ExchangeConnectTokenRequest,
    ExchangeConnectTokenResponse,
    GetOAuth2AuthorizationUrlResponse,
    PLACEHOLDER_CONNECTION_TYPE,
    SaveConnectConnectionRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { oauth2Util } from '../../app-connection/app-connection-service/oauth2/oauth2-util'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { ConnectTokenPayload, connectTokenService } from '../../helper/connect-token-service'
import { platformService } from '../../platform/platform.service'
import { appearanceHelper } from '../helper/appearance-helper'
import { connectOAuth2Resolver } from './connect-oauth2-resolver'

export const connectController: FastifyPluginAsyncZod = async (app) => {
    app.post('/exchange', ExchangeConfig, async (request): Promise<ExchangeConnectTokenResponse> => {
        const payload = await verifyOrThrow(request.body.token, request.log)
        const oauth2App = await connectOAuth2Resolver(request.log).resolve({
            platformId: payload.platformId,
            pieceName: payload.pieceName,
        })
        const theme = await appearanceHelper.getTheme({
            platformId: payload.platformId,
            log: request.log,
        })
        return {
            platformId: payload.platformId,
            projectId: payload.projectId,
            pieceName: payload.pieceName,
            externalId: payload.externalId,
            displayName: payload.displayName ?? null,
            oauth2App,
            theme,
        }
    })

    app.post('/connections', SaveConnectionConfig, async (request): Promise<AppConnectionWithoutSensitiveData> => {
        const payload = await verifyOrThrow(request.body.token, request.log)
        const platform = await platformService(request.log).getOneOrThrow(payload.platformId)
        const connection = request.body.connection

        const baseUpsert = {
            platformId: payload.platformId,
            projectIds: [payload.projectId],
            externalId: payload.externalId,
            displayName: connection.displayName,
            pieceName: payload.pieceName,
            ownerId: platform.ownerId,
            scope: AppConnectionScope.PROJECT,
        }

        return connection.type === PLACEHOLDER_CONNECTION_TYPE
            ? appConnectionService(request.log).upsert({
                ...baseUpsert,
                type: AppConnectionType.NO_AUTH,
                value: { type: AppConnectionType.NO_AUTH },
                status: AppConnectionStatus.MISSING,
            })
            : appConnectionService(request.log).upsert({
                ...baseUpsert,
                type: connection.type,
                value: connection.value,
            })
    })

    app.post('/oauth2/authorization-url', OAuth2UrlConfig, async (request): Promise<GetOAuth2AuthorizationUrlResponse> => {
        const payload = await verifyOrThrow(request.body.token, request.log)
        return oauth2Util(request.log).buildAuthorizationUrl({
            platformId: payload.platformId,
            projectId: payload.projectId,
            pieceName: payload.pieceName,
            pieceVersion: request.body.pieceVersion,
            clientId: request.body.clientId,
            redirectUrl: request.body.redirectUrl,
            scopes: request.body.scopes,
            props: request.body.props,
        })
    })
}

async function verifyOrThrow(token: string, log: FastifyBaseLogger): Promise<ConnectTokenPayload> {
    try {
        return await connectTokenService(log).verify(token)
    }
    catch (error) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: error instanceof Error ? error.message : 'Invalid or expired connect token',
            },
        })
    }
}

const ExchangeConfig = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['connect'],
        description: 'Exchange a ConnectLink token for the connection context the hosted page needs.',
        body: ExchangeConnectTokenRequest,
    },
}

const SaveConnectionConfig = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['connect'],
        description: 'Save a connection from the hosted ConnectLink page, authorized by the connect token.',
        body: SaveConnectConnectionRequest,
    },
}

const OAuth2UrlConfig = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['connect'],
        description: 'Build an OAuth2 authorization URL for the hosted ConnectLink page, authorized by the connect token.',
        body: ConnectOAuth2UrlRequest,
    },
}
