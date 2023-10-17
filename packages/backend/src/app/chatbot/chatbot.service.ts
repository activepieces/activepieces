import {
    ActivepiecesError,
    Cursor,
    ErrorCode,
    ProjectId,
    SeekPage,
    apId,
    isNil,
    AppConnectionType,
    SecretTextConnectionValue,
    TelemetryEventName,
    CreateChatBotRequest,
    Chatbot,
    VisibilityStatus,
    UpdateChatbotRequest,
    ChatbotResponse,
    ChatbotMetadata,
    APChatMessage,
} from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ChatbotEntity } from './chatbot.entity'
import { chatbotHooks } from './chatbot.hooks'
import { telemetry } from '../helper/telemetry.utils'
import { logger } from '../helper/logger'
import { runBot } from './bots/chatbots'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { appConnectionService } from '../app-connection/app-connection-service/app-connection-service'


const chatbotRepo = databaseConnection.getRepository(ChatbotEntity)

export const chatbotService = {
    async save({
        projectId,
        request,
    }: {
        projectId: ProjectId
        request: CreateChatBotRequest
    }): Promise<Chatbot> {
        await chatbotHooks.getHooks().preSave({ projectId })
        const savedChatbot = await chatbotRepo.save({
            ...request,
            displayName: 'Activebot',
            visibilityStatus: VisibilityStatus.PRIVATE,
            id: apId(),
            settings: {},
            dataSources: [],
            projectId,
        })
        telemetry.trackProject(projectId, {
            name: TelemetryEventName.CHATBOT_CREATED,
            payload: {
                chatbotId: savedChatbot.id,
            },
        }).catch((e) => logger.error(e, '[ChatbotService#Start] telemetry.trackProject'))

        return savedChatbot
    },
    async update({
        projectId,
        chatbotId,
        request,
    }: {
        projectId: ProjectId
        chatbotId: string
        request: UpdateChatbotRequest
    }): Promise<Chatbot> {
        const chatbot = await chatbotRepo.findOneBy({
            projectId,
            id: chatbotId,
        })
        if (isNil(chatbot)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${chatbotId} not found`,
                },
            })
        }
        await chatbotRepo.update(chatbotId, {
            displayName: request.displayName,
            visibilityStatus: request.visibilityStatus,
            prompt: request.prompt,
            connectionId: isNil(request.connectionId) ? undefined : request.connectionId,
        })
        return chatbotRepo.findOneByOrFail({
            projectId,
            id: chatbotId,
        })
    },
    async ask({
        projectId,
        chatbotId,
        input,
        history,
    }: {
        projectId: ProjectId
        chatbotId: string
        input: string
        history: APChatMessage[]
    }): Promise<ChatbotResponse> {
        const chatbot = await chatbotRepo.findOneBy({
            id: chatbotId,
        })
        if (isNil(chatbot) || (chatbot.visibilityStatus === VisibilityStatus.PRIVATE && projectId !== chatbot.projectId)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${chatbotId} not found`,
                },
            })
        }
        const connection = await appConnectionService.getOneOrThrow({
            projectId: chatbot.projectId,
            id: chatbot.connectionId,
        })
        if (connection.type != AppConnectionType.SECRET_TEXT) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Connection with id ${chatbot.connectionId} not found`,
                },
            })
        }
        const output = await runBot({
            botId: chatbotId,
            input,
            type: chatbot.type,
            auth: connection.value as SecretTextConnectionValue,
            prompt: chatbot.prompt,
            history,
        })
        return {
            output,
        }

    },
    async list({
        projectId,
        cursorRequest,
        limit,
    }: {
        projectId: ProjectId
        cursorRequest: Cursor | null
        limit: number
    }): Promise<SeekPage<Chatbot>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: ChatbotEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const { data, cursor } = await paginator.paginate(
            chatbotRepo.createQueryBuilder('chatbot').where({
                projectId,
            }),
        )
        return paginationHelper.createPage<Chatbot>(data, cursor)
    },
    async getMetadata({
        id,
        projectId,
    }: {
        id: string
        projectId: ProjectId
    }): Promise<ChatbotMetadata> {
        const chatbot = await chatbotRepo.findOneBy({
            id,
        })
        if (isNil(chatbot) || (chatbot.visibilityStatus !== VisibilityStatus.PUBLIC && chatbot.projectId !== projectId)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${id} not found`,
                },
            })
        }
        return {
            id: chatbot.id,
            displayName: chatbot.displayName,
            created: chatbot.created,
            updated: chatbot.updated,
        }
    },
    async getOneOrThrow({
        id,
        projectId,
    }: {
        id: string
        projectId: ProjectId
    }): Promise<Chatbot> {
        const chatbot = await chatbotRepo.findOneBy({
            id,
            projectId,
        })
        if (isNil(chatbot)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${id} not found`,
                },
            })
        }
        return chatbot
    },
    async delete({
        projectId,
        chatbotId,
    }: {
        projectId: ProjectId
        chatbotId: string
    }): Promise<void> {
        const chatbot = await chatbotRepo.findOneBy({
            projectId,
            id: chatbotId,
        })
        if (isNil(chatbot)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${chatbotId} not found`,
                },
            })
        }
        await chatbotRepo.delete(chatbotId)
    },
}
