import { ActivepiecesError, ApMultipartFile, ErrorCode, FileCompression, FileType, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, tryCatch } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { fileService } from '../file/file.service'
import { knowledgeBaseService } from './knowledge-base.service'

const KB_PRINCIPALS = [PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE] as const
const KB_ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const EMBEDDING_DIMENSIONS = 768

export const knowledgeBaseController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/', CreateKnowledgeBaseFileRequest, async (request, reply) => {
        const result = await knowledgeBaseService(request.log).createFile({
            projectId: request.projectId,
            fileId: request.body.fileId,
            displayName: request.body.displayName,
        })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    fastify.post('/upload', UploadKnowledgeBaseFileRequest, async (request, reply) => {
        const file = request.body.file as ApMultipartFile
        if (!KB_ALLOWED_MIME_TYPES.includes(file.mimetype ?? '')) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Invalid file type. Allowed types: ${KB_ALLOWED_MIME_TYPES.join(', ')}`,
                },
            })
        }

        const savedFile = await fileService(request.log).save({
            projectId: request.projectId,
            data: file.data,
            size: file.data.length,
            type: FileType.KNOWLEDGE_BASE,
            compression: FileCompression.NONE,
            fileName: file.filename,
        })

        const kbFile = await knowledgeBaseService(request.log).createFile({
            projectId: request.projectId,
            fileId: savedFile.id,
            displayName: request.body.displayName,
        })

        const { data: chunks, error } = await tryCatch(
            () => knowledgeBaseService(request.log).extractChunks({
                projectId: request.projectId,
                knowledgeBaseFileId: kbFile.id,
            }),
        )
        if (!error && chunks.length > 0) {
            await knowledgeBaseService(request.log).storeChunks({
                projectId: request.projectId,
                knowledgeBaseFileId: kbFile.id,
                chunks: chunks.map((content, i) => ({
                    content,
                    chunkIndex: i,
                    metadata: { chunkIndex: i, totalChunks: chunks.length },
                })),
            })
        }

        return reply.status(StatusCodes.CREATED).send(kbFile)
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

    fastify.get('/:id/chunks/count', GetChunkCountRequest, async (request) => {
        const count = await knowledgeBaseService(request.log).getChunkCount({
            projectId: request.projectId,
            knowledgeBaseFileId: request.params.id,
        })
        return { count }
    })

    fastify.post('/:id/extract-chunks', ExtractChunksRequest, async (request) => {
        const chunks = await knowledgeBaseService(request.log).extractChunks({
            projectId: request.projectId,
            knowledgeBaseFileId: request.params.id,
        })
        return { chunks }
    })

    fastify.post('/:id/store-chunks', StoreChunksRequest, async (request) => {
        await knowledgeBaseService(request.log).storeChunks({
            projectId: request.projectId,
            knowledgeBaseFileId: request.params.id,
            chunks: request.body.chunks,
        })
        return { success: true }
    })

    fastify.get('/:id/chunks', ListChunksRequest, async (request) => {
        return knowledgeBaseService(request.log).listChunks({
            projectId: request.projectId,
            knowledgeBaseFileId: request.params.id,
            embedded: request.query.embedded !== undefined ? request.query.embedded === 'true' : undefined,
        })
    })

    fastify.post('/search', SearchKnowledgeBaseRequest, async (request) => {
        return knowledgeBaseService(request.log).search({
            projectId: request.projectId,
            knowledgeBaseFileIds: request.body.knowledgeBaseFileIds,
            queryEmbedding: request.body.queryEmbedding,
            limit: request.body.limit ?? 5,
            similarityThreshold: request.body.similarityThreshold,
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

const UploadKnowledgeBaseFileRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.WRITE_KNOWLEDGE_BASE, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        consumes: ['multipart/form-data'],
        description: 'Upload a file and create a knowledge base file record',
        querystring: z.object({
            projectId: z.string(),
        }),
        body: z.object({
            file: ApMultipartFile,
            displayName: z.string(),
        }),
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
        querystring: z.object({
            projectId: z.string(),
        }),
    },
}

const DeleteKnowledgeBaseFileRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.WRITE_KNOWLEDGE_BASE, {
            type: ProjectResourceType.QUERY,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Delete a knowledge base file and all its chunks',
        params: z.object({
            id: z.string(),
        }),
        querystring: z.object({
            projectId: z.string(),
        }),
    },
}

const GetChunkCountRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.READ_KNOWLEDGE_BASE, {
            type: ProjectResourceType.PARAM,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get the number of chunks for a knowledge base file',
        params: z.object({
            id: z.string(),
        }),
    },
}

const ExtractChunksRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.WRITE_KNOWLEDGE_BASE, {
            type: ProjectResourceType.PARAM,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Extract text chunks from a knowledge base file',
        params: z.object({
            id: z.string(),
        }),
    },
}

const StoreChunksRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.WRITE_KNOWLEDGE_BASE, {
            type: ProjectResourceType.PARAM,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Store or update chunks for a knowledge base file. Provide id to update existing chunks, or content to create new ones.',
        params: z.object({
            id: z.string(),
        }),
        body: z.object({
            chunks: z.array(z.object({
                id: z.string().optional(),
                content: z.string().optional(),
                embedding: z.array(z.number()).length(EMBEDDING_DIMENSIONS).optional(),
                chunkIndex: z.number().optional(),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })),
        }),
    },
}

const ListChunksRequest = {
    config: {
        security: securityAccess.project(KB_PRINCIPALS, Permission.READ_KNOWLEDGE_BASE, {
            type: ProjectResourceType.PARAM,
        }),
    },
    schema: {
        tags: ['knowledge-base'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List chunks for a knowledge base file, optionally filtered by embedding status',
        params: z.object({
            id: z.string(),
        }),
        querystring: z.object({
            embedded: z.enum(['true', 'false']).optional(),
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
            queryEmbedding: z.array(z.number()).length(EMBEDDING_DIMENSIONS),
            limit: z.number().int().min(1).max(100).optional().default(5),
            similarityThreshold: z.number().min(0).max(1).optional(),
        }),
    },
}
