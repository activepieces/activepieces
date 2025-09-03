import { ApplicationEvent, ApplicationEventName, CreateOutgoingWebhookRequestBody, OutgoingWebhook, OutgoingWebhookScope } from '@activepieces/ee-shared'
import { JobType } from '@activepieces/server-shared'
import { apId, ApId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { AddAPArrayContainsToQueryBuilder } from '../database/database-connection'
import { jobQueue } from '../workers/queue'
import { DEFAULT_PRIORITY } from '../workers/queue/queue-manager'
import { OutgoingWebhookEntity } from './outgoing-webhooks-entity'

export const outgoingWebhookRepo = repoFactory<OutgoingWebhook>(OutgoingWebhookEntity)

export const outgoingWebhookService = (log: FastifyBaseLogger) => ({
    create: async (request: CreateOutgoingWebhookRequestBody, platformId: string): Promise<OutgoingWebhook> => {
        return outgoingWebhookRepo().save({
            ...request,
            id: apId(),
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
            .where('outgoing_webhook.scope = :platformScope AND outgoing_webhook.platformId = :platformId', {
                platformScope: OutgoingWebhookScope.PLATFORM,
                platformId,
            })
        
        if (projectId) {
            qb.orWhere('outgoing_webhook.scope = :projectScope AND outgoing_webhook.projectId = :projectId', {
                projectScope: OutgoingWebhookScope.PROJECT,
                projectId,
            })
        }            
        AddAPArrayContainsToQueryBuilder(qb, 'events', [event])
        const webhooks = await qb.getMany()

        await Promise.all(webhooks.map(webhook => 
            jobQueue(log).add({
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
            }),
        ))
    },
})

type deleteParams = {
    id: string
    platformId: string
}

type triggerParams = {
    platformId: string
    projectId?: string | undefined
    event: ApplicationEventName
    payload: ApplicationEvent
}
