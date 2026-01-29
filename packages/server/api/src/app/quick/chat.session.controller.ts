import { AppSystemProp, securityAccess } from '@activepieces/server-shared'
import { ApId, ApMultipartFile, ChatSession, ChatWithQuickRequest, CreateChatSessionRequest, FileType, PrincipalType, UpdateChatSessionRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { fileService } from '../file/file.service'
import { system } from '../helper/system/system'
import { chatSessionService } from './chat.session.service'
import { genericAgentService } from '../generic-agent/generic-agent.service'

export const quickModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(chatSessionController, { prefix: '/v1/chat-sessions' })
}

export const chatSessionController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateChatSessionRequestConfig, async (request) => {
        const session = await chatSessionService(request.log).create(request.principal.id)
        return session
    })

    app.post('/:id/update', UpdateChatSessionRequestConfig, async (request) => {
        return chatSessionService(request.log).update({
            id: request.params.id,
            userId: request.principal.id,
            session: request.body as Partial<ChatSession>
        })
    })

    app.get(
        '/:id',
        GetChatSessionRequest,
        async (request) => {

            return chatSessionService(request.log).getOneOrThrow({
                id: request.params.id,
                userId: request.principal.id,
            })
        },
    )

    app.post(
        '/:id/chat',
        ChatWithSessionRequest,
        async (request, reply) => {
            const requestId = await chatSessionService(request.log).chatWithSession({
                platformId: request.principal.platform.id,
                userId: request.principal.id,
                sessionId: request.params.id,
                message: request.body.message,
                files: request.body.files,
            })
            return await genericAgentService(request.log).streamAgentResponse({
                reply,
                requestId,
            })
        },
    )

    app.delete(
        '/:id',
        DeleteChatSessionRequest,
        async (request, reply) => {
            await chatSessionService(request.log).delete({
                id: request.params.id,
                userId: request.principal.id,
            })
            await reply.code(StatusCodes.NO_CONTENT).send()
        },
    )

    app.post(
        '/attachments',
        UploadChatAttachmentRequest,
        async (request) => {
            const platformId = request.principal.platform.id
            const maxFileSizeMb = system.getNumberOrThrow(AppSystemProp.MAX_CHAT_ATTACHMENT_SIZE_MB)
            const url = await fileService(request.log).uploadPublicAsset({
                file: request.body.file,
                type: FileType.CHAT_ATTACHMENT,
                platformId,
                maxFileSizeInBytes: maxFileSizeMb * 1024 * 1024,
                metadata: {
                    uploadedBy: request.principal.id,
                },
            })
            return { url }
        },
    )
}


const CreateChatSessionRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Create a new chat session',
        body: CreateChatSessionRequest,
        response: {
            [StatusCodes.CREATED]: ChatSession,
        },
    },
}

const ChatWithSessionRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        tags: ['chat-sessions'],
        body: ChatWithQuickRequest,
        summary: 'Chat with a session',
    },
}

const UpdateChatSessionRequestConfig = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        tags: ['chat-sessions'],
        summary: 'Update chat session',
        body: UpdateChatSessionRequest,
        response: {
            [StatusCodes.OK]: ChatSession,
        },
    },
}

const GetChatSessionRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Get a specific chat session',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: ChatSession,
        },
    },
}

const DeleteChatSessionRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Delete a chat session',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}

const UploadChatAttachmentRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER]),
    },
    schema: {
        tags: ['chat-sessions'],
        summary: 'Upload a chat attachment',
        consumes: ['multipart/form-data'],
        body: Type.Object({
            file: ApMultipartFile,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                url: Type.Optional(Type.String()),
            }),
        },
    },
}