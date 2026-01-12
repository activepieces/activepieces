import {
    ApplicationEvent,
    ApplicationEventName,
    CreatePlatformOutgoingWebhookRequestBody,
    FlowCreatedEvent,
    OutgoingWebhook,
    OutgoingWebhookScope,
    UpdatePlatformOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared'
import { WorkerSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, apId, assertNotNullOrUndefined, Cursor, ErrorCode, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PlatformId, ProjectId, SeekPage, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, FindOptionsWhere } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { applicationEvents } from '../helper/application-events'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'
import { jobQueue } from '../workers/queue/job-queue'
import { JobType } from '../workers/queue/queue-manager'
import {
    OutgoingWebhookEntity,
    OutgoingWebhookSchema,
} from './outgoing-webhooks.entity'

const outgoingWebhookRepo = repoFactory<OutgoingWebhookSchema>(
    OutgoingWebhookEntity,
)

const PROJECT_SCOPE_EVENTS = [ ApplicationEventName.FLOW_RUN_FINISHED ]

export const outgoingWebhookService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents(log).registerListeners(log, {
            userEvent: () => async (event) => {
                await outgoingWebhookService(log).trigger({
                    platformId: event.platformId,
                    projectId: event.projectId,
                    event,
                })
            },
            workerEvent: () => async (projectId, event) => {
                await outgoingWebhookService(log).trigger({
                    platformId: event.platformId,
                    projectId,
                    event,
                })
            },
        })
    },
    create: async (
        request: CreatePlatformOutgoingWebhookRequestBody,
        platformId: string,
    ): Promise<OutgoingWebhook> => {
        assertUrlIsExternal(request.url)
        const entity: OutgoingWebhook = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            platformId,
            scope: OutgoingWebhookScope.PLATFORM,
            events: request.events,
            url: request.url,
        }
        return outgoingWebhookRepo().save(entity)
    },
    update: async ({ id, platformId, request }: UpdateParams): Promise<OutgoingWebhook> => {
        assertUrlIsExternal(request.url)
        await outgoingWebhookRepo().update({ id, platformId }, request)
        return outgoingWebhookRepo().findOneByOrFail({ id, platformId })
    },
    delete: async ({ id, platformId }: DeleteParams): Promise<void> => {
        await outgoingWebhookRepo().delete({
            id,
            platformId,
        })
    },
    list: async ({
        platformId,
        cursorRequest,
        limit,
    }: ListParams): Promise<SeekPage<OutgoingWebhook>> => {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: OutgoingWebhookEntity,
            query: {
                limit,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = outgoingWebhookRepo()
            .createQueryBuilder('outgoing_webhook')
            .where({
                platformId,
            })

        const { data, cursor } = await paginator.paginate(queryBuilder)

        return paginationHelper.createPage<OutgoingWebhook>(data, cursor)
    },
    trigger: async ({ platformId, projectId, event }: TriggerParams): Promise<void> => {
        const conditions: FindOptionsWhere<OutgoingWebhookSchema>[] = [{
            platformId,
            events: ArrayContains([event]),
            scope: OutgoingWebhookScope.PLATFORM,
        }]
        const broadcastToProject = !isNil(projectId) && PROJECT_SCOPE_EVENTS.includes(event.action)
        if (broadcastToProject) {
            conditions.push({
                projectId,
                events: ArrayContains([event]),
                scope: OutgoingWebhookScope.PROJECT,
            })
        }
        const webhooks = await outgoingWebhookRepo().findBy(conditions)
        await Promise.all(webhooks.map(webhook =>
            jobQueue(log).add({
                type: JobType.ONE_TIME,
                id: apId(),
                data: {
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    platformId,
                    projectId,
                    webhookId: webhook.id,
                    webhookUrl: webhook.url,
                    payload: event.data,
                    jobType: WorkerJobType.OUTGOING_WEBHOOK,
                },
            }),
        ))
    },
    test: async ({ platformId, projectId, url }: TestParams): Promise<void> => {
        assertUrlIsExternal(url)
        const mockEvent: FlowCreatedEvent = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            ip: '127.0.0.1',
            platformId,
            data: {
                flow: {
                    id: apId(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                },
                project: {
                    displayName: 'Dream Department',
                },
            },
            projectId,
            userId: apId(),
            action: ApplicationEventName.FLOW_CREATED,
        }
        await jobQueue(log).add({
            type: JobType.ONE_TIME,
            id: apId(),
            data: {
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                platformId,
                projectId,
                webhookId: apId(),
                webhookUrl: url,
                payload: mockEvent,
                jobType: WorkerJobType.OUTGOING_WEBHOOK,
            },
        })
    },
})

const assertUrlIsExternal = (url: string) => {
    const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL)
    assertNotNullOrUndefined(frontendUrl, 'frontendUrl')
    if (new URL(url).host === new URL(frontendUrl).host) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Activepieces URL is not allowed to avoid recursive calls',
            },
        })
    }
}


type DeleteParams = {
    id: string
    platformId: string
}

type UpdateParams = {
    id: string
    platformId: string
    request: UpdatePlatformOutgoingWebhookRequestBody
}

type ListParams = {
    platformId: PlatformId
    cursorRequest: Cursor
    limit?: number
}

type TriggerParams = {
    platformId: PlatformId
    projectId?: ProjectId
    event: Pick<ApplicationEvent, 'action' | 'data'>
}

type TestParams = {
    platformId: PlatformId
    projectId?: ProjectId
    url: string
}

