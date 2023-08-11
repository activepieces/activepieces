import {
    ActivepiecesError,
    Chatbot,
    CreateOrUpdateChatbotRequest,
    ErrorCode,
    ProjectId,
    apId,
    isNil,
} from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { ChatbotEntity } from './chatbot.entity'

const chatbotRepo = databaseConnection.getRepository<Chatbot>(ChatbotEntity)

export const chatbotService = {
    async save({
        projectId,
        request,
    }: {
        projectId: ProjectId
        request: CreateOrUpdateChatbotRequest
    }): Promise<Chatbot> {
        const savedChatbot = await chatbotRepo.save({
            ...request,
            id: apId(),
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
        chatbotId: string,
        request: CreateOrUpdateChatbotRequest
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
        chatbotRepo.update(chatbotId, {
            displayName: request.displayName,
        })         
        return await chatbotRepo.findOneByOrFail({
            projectId,
            id: chatbotId,
        })
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
        if(isNil(chatbot)){
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${chatbotId} not found`
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
        if(isNil(chatbot)){
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Chatbot with id ${chatbotId} not found`
                },
            })
        }
        await chatbotRepo.delete(chatbotId)
    }
}
