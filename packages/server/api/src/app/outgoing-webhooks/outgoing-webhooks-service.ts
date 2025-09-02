import { JobType } from '@activepieces/server-shared'
import { ApId, CreateOutgoingWebhookRequestBody, OutgoingWebhook, OutgoingWebhookEventType, OutgoingWebhookScope } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { AddAPArrayContainsToQueryBuilder } from '../database/database-connection'
import { jobQueue } from '../workers/queue'
import { DEFAULT_PRIORITY } from '../workers/queue/queue-manager'
import { OutgoingWebhookEntity } from './outgoing-webhooks-entity'

export const outgoingWebhookRepo = repoFactory<OutgoingWebhook>(OutgoingWebhookEntity)

export const outgoingWebhookService = (log: FastifyBaseLogger) => ({
    create: async (request: CreateOutgoingWebhookRequestBody, platformId: string): Promise<OutgoingWebhook> => {
        return outgoingWebhookRepo().create({
            ...request,
            platformId,
        })
    },
    delete: async ({ id, platformId }: deleteParams): Promise<void> => {
        await outgoingWebhookRepo().delete({
            id,
            platformId,
        })
    },
    list: async (platformId: string): Promise<OutgoingWebhook[]> => {
        return outgoingWebhookRepo().find({
            where: {
                platformId,
            },
        })
    },
    trigger: async ({ platformId, projectId, event, payload }: triggerParams): Promise<void> => {
        const qb = outgoingWebhookRepo().createQueryBuilder('outgoing_webhook')
            .where('outgoing_webhook.scope = :projectScope AND outgoing_webhook.projectId = :projectId', {
                projectScope: OutgoingWebhookScope.PROJECT,
                projectId,
            })
            .orWhere('outgoing_webhook.scope = :platformScope AND outgoing_webhook.platformId = :platformId', {
                platformScope: OutgoingWebhookScope.PLATFORM,
                platformId,
            })
            
        AddAPArrayContainsToQueryBuilder(qb, 'events', [event])

        const webhooks = await qb.getMany()

        for (const webhook of webhooks) {
            await jobQueue(log).add({
                type: JobType.OUTGOING_WEBHOOK,
                id: ApId.generate(),
                data: {
                    platformId,
                    projectId,
                    webhookId: webhook.id,
                    url: webhook.url,
                    payload,
                },
                priority: DEFAULT_PRIORITY,
            })
        }
    },
})

type deleteParams = {
    id: string
    platformId: string
}

type triggerParams = {
    platformId: string
    projectId: string
    event: OutgoingWebhookEventType
    payload: Record<string, unknown>
}
