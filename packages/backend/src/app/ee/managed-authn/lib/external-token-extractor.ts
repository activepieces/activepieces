import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { signingKeyService } from '../../signing-key/signing-key-service'
import { logger } from '../../../helper/logger'
import { PlatformId, SigningKey, SigningKeyId } from '@activepieces/ee-shared'

const ALGORITHM = JwtSignAlgorithm.RS256

export const externalTokenExtractor = {
    async extract(token: string): Promise<ExternalPrincipal> {
        const decoded = jwtUtils.decode<ExternalTokenPayload>({ jwt: token })

        const signingKeyId = decoded.header.kid
        const platformId = decoded.payload.platformId

        const signingKey = await getSigningKey({
            signingKeyId,
            platformId,
        })

        try {
            const payload = await jwtUtils.decodeAndVerify<ExternalTokenPayload>({
                jwt: token,
                key: signingKey.publicKey,
                algorithm: ALGORITHM,
                issuer: null,
            })

            assertPlatformIdsMatch(signingKey.platformId, payload.platformId)

            return {
                platformId: payload.platformId,
                externalUserId: payload.sub,
                externalProjectId: payload.projectId,
                externalEmail: payload.email,
                externalFirstName: payload.firstName,
                externalLastName: payload.lastName,
            }
        }
        catch (error) {
            logger.error({ name: 'ExternalTokenExtractor#extract', error })

            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {},
            })
        }
    },
}

const getSigningKey = async ({ signingKeyId, platformId }: GetSigningKeyParams): Promise<SigningKey> => {
    const signingKey = await signingKeyService.get({
        id: signingKeyId,
        platformId,
    })

    if (isNil(signingKey)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {},
        })
    }

    return signingKey
}

const assertPlatformIdsMatch = (signingKeyPlatformId: string, externalTokenPlatformId: string): void => {
    if (signingKeyPlatformId !== externalTokenPlatformId) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {},
        })
    }
}

type ExternalTokenPayload = {
    sub: string
    projectId: string
    platformId: string
    email: string
    firstName: string
    lastName: string
}

type ExternalPrincipal = {
    platformId: PlatformId
    externalUserId: string
    externalProjectId: string
    externalEmail: string
    externalFirstName: string
    externalLastName: string
}

type GetSigningKeyParams = {
    signingKeyId: SigningKeyId
    platformId: PlatformId
}
