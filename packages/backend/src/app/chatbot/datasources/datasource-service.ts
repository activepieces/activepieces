import { chatbotService } from '../chatbot.service'
import { ActivepiecesError, ErrorCode, ProjectId, SecretTextConnectionValue, apId } from '@activepieces/shared'
import { ChatbotEntity } from '../chatbot.entity'
import { datasourceHooks } from './datasource.hooks'
import { Chatbot, CreateDataSourceRequest, DataSource } from '@activepieces/shared'
import { embeddings } from '../embedings'
import { datasources } from '../framework/datasource'
import { databaseConnection } from '../../database/database-connection'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'

const chatbotRepo = databaseConnection.getRepository(ChatbotEntity)

export const datasourceService = {
    async addDatasourceToBot({
        projectId,
        chatbotId,
        request,
    }: {
        projectId: ProjectId
        chatbotId: string
        request: CreateDataSourceRequest
    }): Promise<Chatbot> {
        await datasourceHooks.getHooks().preSave({ projectId })
        const chatbot = await chatbotService.getOneOrThrow({
            id: chatbotId,
            projectId,
        })
        const datasourceId = apId()
        const { size } = await createDatasource({
            request,
            botId: chatbotId,
            datasourceId,
            projectId,

        })
        chatbot.dataSources.push({
            id: datasourceId,
            ...request,
            size,
        })
        return chatbotRepo.save(chatbot)
    },
    async deleteDatasourceFromBot({
        projectId,
        chatbotId,
        datasourceId,
    }: {
        projectId: ProjectId
        chatbotId: string
        datasourceId: string
    }): Promise<Chatbot> {
        const chatbot = await chatbotService.getOneOrThrow({
            projectId,
            id: chatbotId,
        })
        const connection = await appConnectionService.getOneOrThrow({
            projectId,
            id: chatbot.connectionId,
        })
        const dataSource = chatbot.dataSources.find((ds: DataSource) => ds.id === datasourceId)
        if (!dataSource) {
            throw new ActivepiecesError({
                params: {
                    message: `Datasource ${datasourceId} not found`,
                },
                code: ErrorCode.ENTITY_NOT_FOUND,
            })
        }
        chatbot.dataSources = chatbot.dataSources.filter(
            (ds: DataSource) => ds.id !== datasourceId,
        )
        const embedding = embeddings.create({
            botId: chatbotId,
            openAIApiKey: (connection.value as SecretTextConnectionValue).secret_text,
        })
        await embedding.deleteDocuments({
            datasourceId,
        })
        return chatbotRepo.save(chatbot)
    },
}

async function createDatasource({
    request,
    datasourceId,
    projectId,
    botId,
}: {
    request: CreateDataSourceRequest
    botId: string
    projectId: string
    datasourceId: string
}): Promise<{ size: number }> {
    const chatbot = await chatbotService.getOneOrThrow({
        id: botId,
        projectId,
    })
    const appConnection = await appConnectionService.getOneOrThrow({
        projectId,
        id: chatbot.connectionId,
    })
    const docs = await datasources.parsePdf({
        buffer: Buffer.from(request.settings.fileBase64, 'base64'),
    })
    const emb = embeddings.create({
        botId,
        openAIApiKey: (appConnection.value as SecretTextConnectionValue).secret_text,
    })
    await emb.addDocuments({
        botId,
        datasourceId,
        documents: docs,
    })
    return {
        size: docs.reduce((_, doc) => doc.pageContent.length, 0),
    }
}