import {
    ActivepiecesError,
    Chatbot,
    ChatbotResponse,
    CreateDataSourceRequest,
    UpdateChatbotRequest,
    Cursor,
    ErrorCode,
    ProjectId,
    SeekPage,
    apId,
    isNil,
    CreateChatBotRequest,
    AppConnectionType,
    SecretTextConnectionValue,
} from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ChatbotEntity } from './chatbot.entity'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { runBot } from '@activepieces/chatbots'
import { appConnectionService } from '../app-connection/app-connection-service'

const chatbotRepo = databaseConnection.getRepository(ChatbotEntity)

export const chatbotService = {
    async save({
        projectId,
        request,
    }: {
        projectId: ProjectId
        request: CreateChatBotRequest
    }): Promise<Chatbot> {
        const savedChatbot = await chatbotRepo.save({
            ...request,
            displayName: 'Untitled',
            id: apId(),
            settings: {},
            dataSources: [],
            projectId,
        })
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
            prompt: request.prompt,
            connectionId: request.connectionId,
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
    }: {
        projectId: ProjectId
        chatbotId: string
        input: string
    }): Promise<ChatbotResponse> {
        const chatbot = await this.getOneOrThrow({
            projectId,
            chatbotId,
        })
        const connection = await appConnectionService.getOneOrThrow({
            projectId,
            id: chatbot.connectionId,
        });
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
    async getOneOrThrow({
        projectId,
        chatbotId,
    }: {
        projectId: ProjectId
        chatbotId: string
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
