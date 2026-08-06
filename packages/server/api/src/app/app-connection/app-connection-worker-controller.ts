import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil } from '@activepieces/core-utils'
import { AppConnection, EnginePrincipal, GetAppConnectionForWorkerRequestQuery, GetAppConnectionForWorkerRequestQuerystring } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { secretManagersService } from '../ee/secret-managers/secret-managers.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { appConnectionService } from './app-connection-service/app-connection-service'
import { GENERIC_DESTINATION_PIECE_NAMES } from './generic-destination-pieces'

const INTERNAL_ENGINE_TOKEN_HEADER = 'x-ap-internal-engine-token'

export const appConnectionWorkerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/:externalId', GetAppConnectionRequest, async (request): Promise<AppConnection> => {
        const enginePrincipal = (request.principal as EnginePrincipal)
        assertNotNullOrUndefined(enginePrincipal.projectId, 'projectId')
        const appConnection = await appConnectionService(request.log).getOne({
            projectId: enginePrincipal.projectId,
            platformId: enginePrincipal.platform.id,
            externalId: request.params.externalId,
        })

        if (isNil(appConnection)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `externalId=${request.params.externalId}`,
                    entityType: 'AppConnection',
                },
            })
        }

        const enforceConnectionPieceBinding = system.getBoolean(AppSystemProp.ENFORCE_CONNECTION_PIECE_BINDING) ?? false
        if (enforceConnectionPieceBinding) {
            if (GENERIC_DESTINATION_PIECE_NAMES.has(appConnection.pieceName)) {
                throw new ActivepiecesError({
                    code: ErrorCode.APP_CONNECTION_BLOCKED_FOR_PIECE,
                    params: {
                        connectionExternalId: request.params.externalId,
                        pieceName: appConnection.pieceName,
                    },
                })
            }
            const internalEngineTokenHeader = request.headers[INTERNAL_ENGINE_TOKEN_HEADER]
            const internalEngineToken = Array.isArray(internalEngineTokenHeader) ? internalEngineTokenHeader[0] : internalEngineTokenHeader
            const verifiedInternalToken = isNil(internalEngineToken) ? null : await accessTokenManager(request.log).verifyInternalEngineToken(internalEngineToken)
            const requestIsFromTrustedEngineCode = !isNil(verifiedInternalToken) && verifiedInternalToken.jobId === enginePrincipal.id

            if (!requestIsFromTrustedEngineCode || request.query.requestingPieceName !== appConnection.pieceName) {
                // Same code/shape whether the internal token is missing/invalid or the piece
                // name is wrong — a forging caller must not get an oracle distinguishing
                // "your token is bad" from "your claimed piece name is wrong".
                throw new ActivepiecesError({
                    code: ErrorCode.APP_CONNECTION_PIECE_BINDING_MISMATCH,
                    params: {
                        connectionExternalId: request.params.externalId,
                        connectionPieceName: appConnection.pieceName,
                        requestingPieceName: request.query.requestingPieceName,
                    },
                })
            }
        }

        return {
            ...appConnection,
            value: await secretManagersService(request.log).resolveObject({ value: appConnection.value, projectIds: [enginePrincipal.projectId], platformId: enginePrincipal.platform.id, throwOnFailure: false }),
        }
    },
    )

}

const GetAppConnectionRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: GetAppConnectionForWorkerRequestQuery,
        querystring: GetAppConnectionForWorkerRequestQuerystring,
    },
}
