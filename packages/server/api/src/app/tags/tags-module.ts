import { EndpointScope, ListTagsRequest, PrincipalType, SeekPage, Tag, assertNotNullOrUndefined } from "@activepieces/shared";
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { StatusCodes } from "http-status-codes";
import { tagService } from "./tag-service";


export const tagsModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(tagsController)
}


const tagsController: FastifyPluginAsyncTypebox = async (fastify) => {

    await fastify.get('/', ListTagsParams,
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return tagService.list({
                platformId,
                request: request.query,
            })
        },
    )
}

const ListTagsParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        querystring: ListTagsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(Tag),
        },
    },
}