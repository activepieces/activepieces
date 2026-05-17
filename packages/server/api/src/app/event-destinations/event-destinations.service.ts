import {
    apId,
    ApplicationEvent,
    ApplicationEventName,
    buildMockEvent,
    CreatePlatformEventDestinationRequestBody,
    Cursor,
    EventDestination, EventDestinationScope, FlowRunEvent, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PlatformId, ProjectId, SeekPage, tryCatchSync, UpdatePlatformEventDestinationRequestBody, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, FindOptionsWhere } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { applicationEvents } from '../helper/application-events'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { jobQueue, JobType } from '../workers/job-queue/job-queue'
import {
    EventDestinationEntity,
    EventDestinationSchema,
} from './event-destinations.entity'

const eventDestinationRepo = repoFactory<EventDestinationSchema>(
    EventDestinationEntity,
)

const PROJECT_SCOPE_EVENTS = [ ApplicationEventName.FLOW_RUN_FINISHED ]

const FLOW_RUN_EVENT_ACTIONS: ReadonlySet<ApplicationEventName> = new Set([
    ApplicationEventName.FLOW_RUN_STARTED,
    ApplicationEventName.FLOW_RUN_FINISHED,
    ApplicationEventName.FLOW_RUN_RESUMED,
    ApplicationEventName.FLOW_RUN_RETRIED,
])

export const eventDestinationService = (log: FastifyBaseLogger) => ({
    setup(): void {
        applicationEvents(log).registerListeners(log, {
            userEvent: () => async (event) => {
                await eventDestinationService(log).trigger({
                    projectId: event.projectId,
                    event,
                })
            },
            workerEvent: () => async (projectId, event) => {
                await eventDestinationService(log).trigger({
                    projectId,
                    event,
                })
            },
        })
    },
    create: async (
        request: CreatePlatformEventDestinationRequestBody,
        platformId: string,
    ): Promise<EventDestination> => {
        const entity: EventDestination = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            platformId,
            scope: EventDestinationScope.PLATFORM,
            events: request.events,
            url: request.url,
        }
        return eventDestinationRepo().save(entity)
    },
    update: async ({ id, platformId, request }: UpdateParams): Promise<EventDestination> => {
        await eventDestinationRepo().update({ id, platformId }, request)
        return eventDestinationRepo().findOneByOrFail({ id, platformId })
    },
    delete: async ({ id, platformId }: DeleteParams): Promise<void> => {
        await eventDestinationRepo().delete({
            id,
            platformId,
        })
    },
    list: async ({
        platformId,
        cursorRequest,
        limit,
    }: ListParams): Promise<SeekPage<EventDestination>> => {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: EventDestinationEntity,
            query: {
                limit,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = eventDestinationRepo()
            .createQueryBuilder('event_destination')
            .where({
                platformId,
            })

        const { data, cursor } = await paginator.paginate(queryBuilder)

        return paginationHelper.createPage<EventDestination>(data, cursor)
    },
    trigger: async ({ projectId, event }: TriggerParams): Promise<void> => {
        const platformId = event.platformId
        const conditions: FindOptionsWhere<EventDestinationSchema>[] = [{
            platformId,
            events: ArrayContains([event.action]),
            scope: EventDestinationScope.PLATFORM,
        }]
        const broadcastToProject = !isNil(projectId) && PROJECT_SCOPE_EVENTS.includes(event.action)
        if (broadcastToProject) {
            conditions.push({
                platformId,
                projectId,
                events: ArrayContains([event.action]),
                scope: EventDestinationScope.PROJECT,
            })
        }
        const destinations = await eventDestinationRepo().findBy(conditions)
        const destinationsToDispatch = await skipInternalDestinationsOnFlowCycle({
            destinations,
            event,
            platformId,
            log,
        })
        await Promise.all(destinationsToDispatch.map(destination =>
            jobQueue(log).add({
                type: JobType.ONE_TIME,
                id: apId(),
                data: {
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    platformId,
                    projectId,
                    webhookId: destination.id,
                    webhookUrl: destination.url,
                    payload: event,
                    jobType: WorkerJobType.EVENT_DESTINATION,
                },
            }),
        ))
    },
    test: async ({ platformId, projectId, url, event }: TestParams): Promise<void> => {
        const eventToTest = event ?? ApplicationEventName.FLOW_CREATED
        const mockEvent = buildMockEvent({ event: eventToTest, platformId, projectId })
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
                jobType: WorkerJobType.EVENT_DESTINATION,
            },
        })
    },
})


const skipInternalDestinationsOnFlowCycle = async ({
    destinations,
    event,
    platformId,
    log,
}: SkipDestinationsParams): Promise<EventDestinationSchema[]> => {
    if (destinations.length === 0 || !isFlowRunEvent(event)) {
        return destinations
    }
    const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
        path: 'v1/webhooks',
        platformId,
    })
    const destinationsWithFlowIds = destinations.map((destination) => ({
        destination,
        flowId: extractFlowIdFromWebhookUrl({
            destinationUrl: destination.url,
            webhookUrlPrefix,
        }),
    }))
    const internalFlowIds = new Set(
        destinationsWithFlowIds
            .map(({ flowId }) => flowId)
            .filter((flowId): flowId is string => !isNil(flowId)),
    )
    const eventFlowId = event.data.flowRun.flowId
    if (!internalFlowIds.has(eventFlowId)) {
        return destinations
    }
    log.warn({
        flowId: eventFlowId,
        action: event.action,
    }, '[eventDestinationService#trigger] Source flow is wired as an internal webhook target; dropping internal destinations to break the cycle, external destinations will still fire')
    return destinationsWithFlowIds
        .filter(({ flowId }) => isNil(flowId))
        .map(({ destination }) => destination)
}

const isFlowRunEvent = (
    event: Pick<ApplicationEvent, 'action' | 'data'>,
): event is Pick<FlowRunEvent, 'action' | 'data'> => FLOW_RUN_EVENT_ACTIONS.has(event.action)

const extractFlowIdFromWebhookUrl = ({
    destinationUrl,
    webhookUrlPrefix,
}: ExtractFlowIdParams): string | null => {
    const { data: destination } = tryCatchSync(() => new URL(destinationUrl))
    const { data: prefix } = tryCatchSync(() => new URL(webhookUrlPrefix))
    if (isNil(destination) || isNil(prefix) || destination.origin !== prefix.origin) {
        return null
    }
    const prefixPath = prefix.pathname + '/'
    if (!destination.pathname.startsWith(prefixPath)) {
        return null
    }
    const destinationWithoutPrefix = destination.pathname.slice(prefixPath.length)
    const slashIndex = destinationWithoutPrefix.indexOf('/')
    const flowId = slashIndex === -1 ? destinationWithoutPrefix : destinationWithoutPrefix.slice(0, slashIndex)
    return flowId || null
}


type DeleteParams = {
    id: string
    platformId: string
}

type UpdateParams = {
    id: string
    platformId: string
    request: UpdatePlatformEventDestinationRequestBody
}

type ListParams = {
    platformId: PlatformId
    cursorRequest: Cursor
    limit?: number
}

type TriggerParams = {
    projectId?: ProjectId
    event: ApplicationEvent
}

type TestParams = {
    platformId: PlatformId
    projectId?: ProjectId
    url: string
    event?: ApplicationEventName
}

type SkipDestinationsParams = {
    destinations: EventDestinationSchema[]
    event: ApplicationEvent
    platformId: PlatformId
    log: FastifyBaseLogger
}

type ExtractFlowIdParams = {
    destinationUrl: string
    webhookUrlPrefix: string
}

