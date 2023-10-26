import { ActivepiecesError, DataSource, ErrorCode, ProjectId } from '@activepieces/shared'
import { plansService } from '../../plans/plan.service'
import { databaseConnection } from '../../../../database/database-connection'
import { ChatbotEntity } from '../../../../chatbot/chatbot.entity'

const chatbotRepo = databaseConnection.getRepository(ChatbotEntity)

async function limitBots({ projectId }: { projectId: ProjectId }): Promise<void> {
    const { bots: botsQuota } = await plansService.getOrCreateDefaultPlan({ projectId })
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
    const { datasourcesSize: datasourcesSize, datasources: datasourcesNumber } = await plansService.getOrCreateDefaultPlan({ projectId })
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