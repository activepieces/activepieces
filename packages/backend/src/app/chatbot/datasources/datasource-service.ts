import { pdf } from '@activepieces/piece-pdf'
import { faissEmbedding } from '@activepieces/chatbots'
import { chatbotService } from '../chatbot.service'
import { appConnectionService } from '../../app-connection/app-connection-service'
import { ActivepiecesError, Chatbot, CreateDataSourceRequest, ErrorCode, ProjectId, SecretTextConnectionValue, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { ChatbotEntity } from '../chatbot.entity'
import { Piece } from '@activepieces/pieces-framework'

const piecesWithDataSource: Piece[] = [pdf]
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
        const chatbot = await chatbotService.getOneOrThrow({
            projectId,
            chatbotId,
        })
        const datasourceId = apId()
        chatbot.dataSources.push({
            id: datasourceId,
            ...request,
        })
        await createDatasource({
            botId: chatbotId,
            datasourceId,
            projectId,
            propsValue: request.props,
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
            chatbotId,
        })
        const connection = await appConnectionService.getOneOrThrow({
            projectId,
            id: chatbot.connectionId,
        })
        const dataSource = chatbot.dataSources.find((ds) => ds.id === datasourceId)
        if (!dataSource) {
            throw new ActivepiecesError({
                params: {
                    message: `Datasource ${datasourceId} not found`,
                },
                code: ErrorCode.ENTITY_NOT_FOUND
            })
        }
        chatbot.dataSources = chatbot.dataSources.filter(
            (ds) => ds.id !== datasourceId,
        )
        const embedding = faissEmbedding({
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
    propsValue,
    datasourceId,
    projectId,
    botId,
}: {
    propsValue: Record<string, unknown>
    botId: string
    projectId: string
    datasourceId: string
}) {
    const chatbot = await chatbotService.getOneOrThrow({
        chatbotId: botId,
        projectId
    })
    const appConnection = await appConnectionService.getOneOrThrow({
        projectId,
        id: chatbot.connectionId,
    })
    const fromFile = Object.values(piecesWithDataSource[0].datasources())[0]

    const docs = await fromFile.sync({
        auth: undefined,
        propsValue,
    })
    const embedding = faissEmbedding({
        botId,
        openAIApiKey: (appConnection.value as SecretTextConnectionValue).secret_text,
    })
    await embedding.addDocuments({
        datasourceId,
        documents: docs,
    })
}