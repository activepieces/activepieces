import { isNil, tryCatch } from '@activepieces/core-utils'
import { PropertyType } from '@activepieces/pieces-framework'
import { safeHttp } from '@activepieces/server-utils'
import { AppConnectionType, ConnectOAuth2App } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { platformService } from '../../platform/platform.service'
import { oauthAppService } from '../oauth-apps/oauth-app.service'

const CLOUD_OAUTH2_APPS_URL = 'https://secrets.activepieces.com/apps'

export const connectOAuth2Resolver = (log: FastifyBaseLogger) => ({
    async resolve({ platformId, pieceName }: ResolveParams): Promise<ConnectOAuth2App | null> {
        const { data: pieceMetadata } = await tryCatch(() => pieceMetadataService(log).getOrThrow({
            name: pieceName,
            platformId,
            version: undefined,
        }))
        if (isNil(pieceMetadata)) {
            return null
        }
        const auth = Array.isArray(pieceMetadata.auth)
            ? pieceMetadata.auth.find((candidate) => candidate.type === PropertyType.OAUTH2)
            : pieceMetadata.auth
        if (isNil(auth) || auth.type !== PropertyType.OAUTH2) {
            return null
        }

        const platformApp = await oauthAppService.getOne({ platformId, pieceName })
        if (!isNil(platformApp)) {
            return { oauth2Type: AppConnectionType.PLATFORM_OAUTH2, clientId: platformApp.clientId }
        }

        const platform = await platformService(log).getOneOrThrow(platformId)
        if (platform.cloudAuthEnabled) {
            const cloudClientId = await fetchCloudClientId(pieceName)
            if (!isNil(cloudClientId)) {
                return { oauth2Type: AppConnectionType.CLOUD_OAUTH2, clientId: cloudClientId }
            }
        }

        return { oauth2Type: AppConnectionType.OAUTH2, clientId: null }
    },
})

async function fetchCloudClientId(pieceName: string): Promise<string | null> {
    const { data, error } = await tryCatch(() =>
        safeHttp.axios.get<Record<string, { clientId: string }>>(CLOUD_OAUTH2_APPS_URL, {
            params: { edition: system.getEdition() },
        }),
    )
    if (!isNil(error) || isNil(data)) {
        return null
    }
    return data.data[pieceName]?.clientId ?? null
}

type ResolveParams = {
    platformId: string
    pieceName: string
}
