import { assertNotNullOrUndefined, ListTagsRequest, PrincipalType, SeekPage, SetPieceTagsRequest, Tag, UpsertTagRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../../ee/authentication/ee-authorization'
import { pieceTagService } from './pieces/piece-tag.service'
import { tagService } from './tag-service'
import { AuthorizationType, RouteKind } from '@activepieces/server-shared'


export const tagsModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(tagsController, { prefix: '/v1/tags' })
}


const tagsController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/', ListTagsParams,
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return tagService.list({
                platformId,
                request: request.query,
            })
        },
    )

    fastify.post('/', UpsertTagParams, async (req, reply) => {
        const platformId = req.principal.platform.id
        const tag = await tagService.upsert(platformId, req.body.name)
        await reply.status(StatusCodes.CREATED).send(tag)
    })

    fastify.post('/pieces', setPiecesTagsParams, async (req, reply) => {
        const platformId = req.principal.platform.id
        const pieces = req.body.piecesName.map(pieceName => pieceTagService.set(platformId, pieceName, req.body.tags))
        await Promise.all(pieces)
        await reply.status(StatusCodes.CREATED).send({})
    })
    
}

const UpsertTagParams = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals: [PrincipalType.USER] as const,
                adminOnly: true,
            },
        } as const,
    },
    schema: {
        body: UpsertTagRequest,
        response: {
            [StatusCodes.CREATED]: Tag,
        },
    },
}

const setPiecesTagsParams = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
                adminOnly: true,
            },
        } as const,
    },
    schema: {
        body: SetPieceTagsRequest,
        response: {
            [StatusCodes.CREATED]: Type.Object({}),
        },
    },
}

const ListTagsParams = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PLATFORM,
                allowedPrincipals: [PrincipalType.USER] as const,
                adminOnly: true,
            },
        } as const,
    },
    schema: {
        querystring: ListTagsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(Tag),
        },
    },
}