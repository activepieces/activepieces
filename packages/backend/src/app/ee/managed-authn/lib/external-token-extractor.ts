import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { signingKeyService } from '../../signing-key/signing-key-service'
import { logger } from '../../../helper/logger'
import { SigningKey, SigningKeyId } from '@activepieces/ee-shared'

const ALGORITHM = JwtSignAlgorithm.RS256

export const externalTokenExtractor = {
    async extract(token: string): Promise<ExternalPrincipal> {
        const decoded = jwtUtils.decode<ExternalTokenPayload>({ jwt: token })

        const signingKeyId = decoded.header.kid

        const signingKey = await getSigningKey({
            signingKeyId,
        })

        try {
            const payload = await jwtUtils.decodeAndVerify<ExternalTokenPayload>({
                jwt: token,
                key: signingKey.publicKey,
                algorithm: ALGORITHM,
                issuer: null,
            })

            return {
                platformId: signingKey.platformId,
                externalUserId: payload.externalUserId,
                externalProjectId: payload.externalProjectId,
                externalEmail: payload.email,
                externalFirstName: payload.firstName,
                externalLastName: payload.lastName,
            }
        }
        catch (error) {
            logger.error({ name: 'ExternalTokenExtractor#extract', error })

            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {
                    message: error instanceof Error ? error.message : 'error decoding token',
                },
            })
        }
    },
}

const getSigningKey = async ({ signingKeyId }: GetSigningKeyParams): Promise<SigningKey> => {
    const signingKey = await signingKeyService.get({
        id: signingKeyId,
    })

    if (isNil(signingKey)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: `signing key not found signingKeyId=${signingKeyId}`,
            },
        })
    }

    return signingKey
}

export type ExternalTokenPayload = {
    externalUserId: string
    externalProjectId: string
    email: string
    firstName: string
    lastName: string
}

export type ExternalPrincipal = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    externalEmail: string
    externalFirstName: string
    externalLastName: string
}

type GetSigningKeyParams = {
    signingKeyId: SigningKeyId
}
