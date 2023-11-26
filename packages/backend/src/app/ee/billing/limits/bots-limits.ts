import { ActivepiecesError, DataSource, ErrorCode, ProjectId } from '@activepieces/shared'
import { ChatbotEntity } from '../../../chatbot/chatbot.entity'
import { databaseConnection } from '../../../database/database-connection'


const chatbotRepo = databaseConnection.getRepository(ChatbotEntity)

// TODO REMOVE WITH BOTS
async function limitBots({ projectId }: { projectId: ProjectId }): Promise<void> {
    const botsQuota = 10
    const botsCount = await chatbotRepo.countBy({ projectId })

    if (botsCount >= botsQuota) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                quota: botsQuota,
                metric: 'bots',
            },
        })
    }
}

async function limitDatasourcesSize({ projectId }: { projectId: ProjectId }): Promise<void> {
    const datasourcesNumber = 10
    const datasourcesSize = 4 * 1024 * 1024
    const chatbots = await chatbotRepo.findBy({
        projectId,
    })
    const storageUsed = chatbots.reduce((_, chatbot) => {
        return chatbot.dataSources.reduce((_: unknown, datasource: DataSource) => datasource.size, 0)
    }, 0)
    const numberOfDatasouces = chatbots.reduce((_, chatbot) => {
        return chatbot.dataSources.length
    }, 0)
    if (storageUsed >= datasourcesSize || numberOfDatasouces >= datasourcesNumber) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                quota: datasourcesSize,
                metric: 'datasource',
            },
        })
    }
}

export const botsLimits = {
    limitDatasourcesSize,
    limitBots,
}