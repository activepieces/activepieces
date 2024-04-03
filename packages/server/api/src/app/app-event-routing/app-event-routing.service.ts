import { databaseConnection } from '../database/database-connection'
import {
    AppEventRouting,
    AppEventRoutingEntity,
} from './app-event-routing.entity'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { apId, FlowId, ProjectId } from '@activepieces/shared'

const appEventRoutingRepo = databaseConnection.getRepository(
    AppEventRoutingEntity,
)

export const appEventRoutingService = {
    async listListeners({
        appName,
        event,
        identifierValue,
    }: {
        appName: string
        event: string
        identifierValue: string
    }): Promise<AppEventRouting[]> {
        return appEventRoutingRepo.findBy({ appName, event, identifierValue })
    },
    async createListeners({
        appName,
        events,
        identifierValue,
        flowId,
        projectId,
    }: {
        appName: string
        events: string[]
        identifierValue: string
        flowId: FlowId
        projectId: ProjectId
    }): Promise<void> {
        logger.info(
            `Creating listeners for ${appName}, events=${events}, identifierValue=${identifierValue}`,
        )
        const upsertCommands: Promise<unknown>[] = []
        events.forEach((event) => {
            const upsert = appEventRoutingRepo.upsert(
                {
                    id: apId(),
                    appName,
                    event,
                    identifierValue,
                    flowId,
                    projectId,
                },
                ['appName', 'event', 'identifierValue', 'projectId'],
            )
            upsertCommands.push(upsert)
        })
        await Promise.all(upsertCommands)
    },
    async deleteListeners({
        projectId,
        flowId,
    }: {
        projectId: ProjectId
        flowId: FlowId
    }): Promise<void> {
        await appEventRoutingRepo.delete({
            projectId,
            flowId,
        })
    },
    async getAppWebhookUrl({
        appName,
    }: {
        appName: string
    }): Promise<string | undefined> {
        const webhookUrl = system.get(SystemProp.WEBHOOK_URL)
        if (webhookUrl) {
            return `${webhookUrl}/v1/app-events/${appName}`
        }
        const frontendUrl = system.get(SystemProp.FRONTEND_URL)
        return `${frontendUrl}/api/v1/app-events/${appName}`
    },
}
