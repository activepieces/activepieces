import { Static, Type } from '@sinclair/typebox'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { signingKeyService } from '../../signing-key/signing-key-service'
import { SigningKey, SigningKeyId } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, PiecesFilterType, ProjectMemberRole } from '@activepieces/shared'

const ALGORITHM = JwtSignAlgorithm.RS256

export const externalTokenExtractor = {
    async extract(token: string): Promise<ExternalPrincipal> {
        const decoded = jwtUtils.decode<ExternalTokenPayload>({ jwt: token })

        const signingKeyId = decoded?.header?.kid

        if (isNil(signingKeyId)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {
                    message: 'signing key id is not found in the header',
                },
            })
        }

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
                role: payload?.role ?? ProjectMemberRole.EDITOR,
                pieces: {
                    filterType: payload?.pieces?.filterType ?? PiecesFilterType.NONE,
                    tags: payload?.pieces?.tags ?? [],
                },
            }
        }
        catch (error) {
            logger.error({ name: 'ExternalTokenExtractor#extract', error })

            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {
                    message:
                        error instanceof Error ? error.message : 'error decoding token',
                },
            })
        }
    },
}

const getSigningKey = async ({
    signingKeyId,
}: GetSigningKeyParams): Promise<SigningKey> => {
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

function externalTokenPayload() {
    const v1 = Type.Object({
        externalUserId: Type.String(),
        externalProjectId: Type.String(),
        email: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
    })
    const v2 = Type.Composite([v1,
        Type.Object({
            role: Type.Optional(Type.Enum(ProjectMemberRole)),
            pieces: Type.Optional(Type.Object({
                filterType: Type.Enum(PiecesFilterType),
                tags: Type.Optional(Type.Array(Type.String())),
            })),
        }),
    ])
    return v2
}

export const ExternalTokenPayload = externalTokenPayload()

export type ExternalTokenPayload = Static<typeof ExternalTokenPayload>

export type ExternalPrincipal = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    externalEmail: string
    externalFirstName: string
    externalLastName: string
    role: ProjectMemberRole
    pieces: {
        filterType: PiecesFilterType
        tags: string[]
    }
}

type GetSigningKeyParams = {
    signingKeyId: SigningKeyId
}
