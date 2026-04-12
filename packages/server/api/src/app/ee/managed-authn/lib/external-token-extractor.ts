import { ActivepiecesError, DefaultProjectRole, ErrorCode, isNil, PiecesFilterType, PlatformId, SigningKey, SigningKeyId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { projectRoleService } from '../../projects/project-role/project-role.service'
import { signingKeyService } from '../../signing-key/signing-key-service'

const ALGORITHM = JwtSignAlgorithm.RS256

export const externalTokenExtractor = (log: FastifyBaseLogger) => {
    return {
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

                const projectRole = await getProjectRole(payload, signingKey.platformId)

                const { piecesFilterType, piecesTags } = extractPieces(payload)
                return {
                    platformId: signingKey.platformId,
                    externalUserId: payload.externalUserId,
                    externalProjectId: payload.externalProjectId,
                    externalFirstName: payload.firstName,
                    externalLastName: payload.lastName,
                    projectRole: projectRole.name,
                    pieces: {
                        filterType: piecesFilterType ?? PiecesFilterType.NONE,
                        tags: piecesTags ?? [],
                    },
                    concurrencyPoolKey: payload.concurrencyPoolKey,
                    concurrencyPoolLimit: payload.concurrencyPoolLimit,
                }
            }
            catch (error) {
                log.error({ err: error }, '[externalTokenExtractor#extract] Failed to extract external token')

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
    const v1 = z.object({
        externalUserId: z.string(),
        externalProjectId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
    })
    const v2 = v1.extend({
        role: z.nativeEnum(DefaultProjectRole).optional(),
        pieces: z.object({
            filterType: z.nativeEnum(PiecesFilterType),
            tags: z.array(z.string()).optional(),
        }).optional(),
        concurrencyPoolKey: z.string().optional(),
        concurrencyPoolLimit: z.number().int().positive().optional(),
    })

    const v3 = v2.omit({ pieces: true }).extend({
        version: z.literal('v3'),
        piecesFilterType: z.nativeEnum(PiecesFilterType).optional(),
        piecesTags: z.array(z.string()).optional(),
    })

    return z.union([v2, v3])
}

export const ExternalTokenPayload = externalTokenPayload()

export type ExternalTokenPayload = z.infer<typeof ExternalTokenPayload>

export type ExternalPrincipal = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    externalFirstName: string
    externalLastName: string
    projectRole: string
    pieces: {
        filterType: PiecesFilterType
        tags: string[]
    }
    projectDisplayName?: string
    concurrencyPoolKey?: string
    concurrencyPoolLimit?: number
}

type GetSigningKeyParams = {
    signingKeyId: SigningKeyId
}
