import { Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { knowledgeBaseService } from './knowledge-base.service'

const KB_PRINCIPALS = [PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE] as const

export const knowledgeBaseController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/', CreateKnowledgeBaseFileRequest, async (request, reply) => {
        const result = await knowledgeBaseService(request.log).createFile({
            projectId: request.projectId,
            fileId: request.body.fileId,
            displayName: request.body.displayName,
        })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    fastify.get('/', ListKnowledgeBaseFilesRequest, async (request) => {
        return knowledgeBaseService(request.log).listFiles({
            projectId: request.projectId,
        })
    })

    fastify.delete('/:id', DeleteKnowledgeBaseFileRequest, async (request, reply) => {
        await knowledgeBaseService(request.log).deleteFile({
            projectId: request.projectId,
            id: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    fastify.post('/search', SearchKnowledgeBaseRequest, async (request) => {
        return knowledgeBaseService(request.log).search({
            projectId: request.projectId,
            knowledgeBaseFileIds: request.body.knowledgeBaseFileIds,
            queryEmbedding: request.body.queryEmbedding,
            limit: request.body.limit ?? 5,
        })
    })
}

const CreateKnowledgeBaseFileRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.WRITE_KNOWLEDGE_BASE, {
            type: ProjectResourceType.BODY,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Register a file for knowledge base ingestion',
        body: z.object({
            fileId: z.string(),
            displayName: z.string(),
        }),
        response: {
            [StatusCodes.CREATED]: z.object({
                id: z.string(),
            }),
        },
    },
}

const ListKnowledgeBaseFilesRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.READ_KNOWLEDGE_BASE, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List knowledge base files for the project',
    },
}

const DeleteKnowledgeBaseFileRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.WRITE_KNOWLEDGE_BASE, {
            type: ProjectResourceType.PARAM,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete a knowledge base file and all its chunks',
        params: z.object({
            id: z.string(),
        }),
    },
}

const SearchKnowledgeBaseRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.READ_KNOWLEDGE_BASE, {
            type: ProjectResourceType.BODY,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Search knowledge base using vector similarity',
        body: z.object({
            knowledgeBaseFileIds: z.array(z.string()),
            queryEmbedding: z.array(z.number()).min(1),
            limit: z.number().int().min(1).max(100).optional().default(5),
        }),
    },
}
