import { securityAccess } from '@activepieces/server-common'
import { assertNotNullOrUndefined, ListTagsRequest, PrincipalType, SeekPage, SetPieceTagsRequest, Tag, UpsertTagRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { pieceTagService } from './pieces/piece-tag.service'
import { tagService } from './tag-service'


export const tagsModule: FastifyPluginAsyncTypebox = async (app) => {
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

    fastify.delete('/:tagId', deleteTagParam, async (req, reply) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        const { tagId } = req.params
        await tagService.delete({ platformId, tagId })
        await reply.status(StatusCodes.OK).send({})
    })
    
}

const UpsertTagParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
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
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        body: SetPieceTagsRequest,
        response: {
            [StatusCodes.CREATED]: Type.Object({}),
        },
    },
}

const deleteTagParam = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            tagId: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Type.Object({}),
        },
    },
}

const ListTagsParams = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        querystring: ListTagsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(Tag),
        },
    },
}