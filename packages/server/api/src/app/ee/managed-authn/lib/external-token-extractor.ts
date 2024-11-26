import { SigningKey, SigningKeyId } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, DefaultProjectRole, ErrorCode, isNil, PiecesFilterType, PlatformId } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { projectRoleService } from '../../project-role/project-role.service'
import { signingKeyService } from '../../signing-key/signing-key-service'

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

            const optionalEmail = payload.email ?? payload.externalUserId

            const projectRole = await getProjectRole(payload, signingKey.platformId)

            const { piecesFilterType, piecesTags } = extractPieces(payload)
            return {
                platformId: signingKey.platformId,
                externalUserId: payload.externalUserId,
                externalProjectId: payload.externalProjectId,
                externalEmail: optionalEmail,
                externalFirstName: payload.firstName,
                externalLastName: payload.lastName,
                projectRole: projectRole.name,
                tasks: payload?.tasks,
                pieces: {
                    filterType: piecesFilterType ?? PiecesFilterType.NONE,
                    tags: piecesTags ?? [],
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

function extractPieces(payload: ExternalTokenPayload) {
    if ('version' in payload && payload.version === 'v3') {
        return {
            piecesFilterType: payload.piecesFilterType,
            piecesTags: payload.piecesTags,
        }
    }
    if ('pieces' in payload) {
        return {
            piecesFilterType: payload.pieces?.filterType,
            piecesTags: payload.pieces?.tags,
        }
    }
    return {
        piecesFilterType: PiecesFilterType.NONE,
        piecesTags: [],
    }
}

async function getProjectRole(payload: ExternalTokenPayload, platformId: PlatformId) {
    if ('role' in payload && !isNil(payload.role)) {
        return projectRoleService.getOneOrThrow({
            name: payload.role,
            platformId,
        })
    }
    return projectRoleService.getOneOrThrow({
        name: DefaultProjectRole.EDITOR,
        platformId,
    })
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
            tasks: Type.Optional(Type.Number()),
            role: Type.Optional(Type.Enum(DefaultProjectRole)),
            pieces: Type.Optional(Type.Object({
                filterType: Type.Enum(PiecesFilterType),
                tags: Type.Optional(Type.Array(Type.String())),
            })),
        }),
    ])

    const v3 = Type.Composite([Type.Omit(v2, ['pieces']), Type.Object({
        version: Type.Literal('v3'),
        piecesFilterType: Type.Optional(Type.Enum(PiecesFilterType)),
        piecesTags: Type.Optional(Type.Array(Type.String())),
    })])

    return Type.Union([v2, v3])
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
    projectRole: string
    pieces: {
        filterType: PiecesFilterType
        tags: string[]
    }
    aiTokens?: number
    tasks?: number
}

type GetSigningKeyParams = {
    signingKeyId: SigningKeyId
}
