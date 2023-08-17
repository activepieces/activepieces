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
} from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ChatbotEntity } from './chatbot.entity'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { getChatBotType, runBot } from '@activepieces/chatbots'
import { datasourceService } from './datasources/datasource-service'

const chatbotRepo = databaseConnection.getRepository(ChatbotEntity)

export const chatbotService = {
    async save({
        projectId,
        request,
    }: {
        projectId: ProjectId
        request: CreateChatBotRequest
    }): Promise<Chatbot> {
        const chatbotType = getChatBotType({ type: request.type })
        const savedChatbot = await chatbotRepo.save({
            ...request,
            id: apId(),
            displayName: chatbotType.displayName,
            // TODO FIX MISSING
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
            settings: request.settings,
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
        const output = await runBot({
            botId: chatbotId,
            input,
            type: chatbot.type,
            settings: chatbot.settings,
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
    async createDatasource({
        projectId,
        chatbotId,
        request,
    }: {
        projectId: ProjectId
        chatbotId: string
        request: CreateDataSourceRequest
    }): Promise<Chatbot> {
        const chatbot = await chatbotService.getOneOrThrow({
            projectId,
            chatbotId,
        })
        const datasourceId = apId()
        chatbot.dataSources.push({
            id: datasourceId,
            ...request,
        })
        await datasourceService.syncDatasource({
            botId: chatbotId,
            datasourceId,
            propsValue: request.props,
            auth: request.auth,
        })
        return chatbotRepo.save(chatbot)
    },
    async deleteDatasource({
        projectId,
        chatbotId,
        dataSourceId,
    }: {
        projectId: ProjectId
        chatbotId: string
        dataSourceId: string
    }): Promise<Chatbot> {
        const chatbot = await chatbotService.getOneOrThrow({
            projectId,
            chatbotId,
        })
        chatbot.dataSources = chatbot.dataSources.filter(
            (ds) => ds.id !== dataSourceId,
        )
        await datasourceService.deleteDataSource({
            botId: chatbotId,
            datasourceId: dataSourceId,
        })
        return chatbotRepo.save(chatbot)
    },
}
