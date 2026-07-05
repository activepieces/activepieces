import { apId, Cursor, isNil, PlatformId, ProjectId, SeekPage, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { ApplicationEvent, ApplicationEventName, buildMockEvent, CreatePlatformEventDestinationRequestBody, EventDestination, EventDestinationScope, EventPayload, FlowRunEvent, LATEST_JOB_DATA_SCHEMA_VERSION, UpdatePlatformEventDestinationRequestBody, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ArrayContains, FindOptionsWhere } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { applicationEvents } from '../helper/application-events'
import { domainHelper } from '../helper/domain-helper'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { WebhookFlowVersionToRun, webhookService } from '../webhooks/webhook.service'
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

// Only routes whose semantics survive being rewritten to an async production dispatch qualify for
// internal delivery: '' (the plain async route) and '/sync' (same execution, only the discarded
// response differs). '/draft' and '/test' run a different flow version with different sample-data
// semantics, so they keep going through the outbound HTTP path instead of being silently rewritten.
const INTERNAL_DISPATCH_ROUTE_SUFFIXES: ReadonlySet<string> = new Set(['', '/sync'])

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
        if (destinations.length === 0) {
            return
        }
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const classifiedDestinations = destinations.map((destination) =>
            classifyDestination({ destination, webhookUrlPrefix }))
        const destinationsToDispatch = skipInternalDestinationsOnFlowCycle({
            classifiedDestinations,
            event,
            log,
        })
        await Promise.all(destinationsToDispatch.map(({ destination, internalFlowId }) =>
            dispatchEventToDestination({
                log,
                platformId,
                projectId,
                destinationId: destination.id,
                destinationUrl: destination.url,
                internalFlowId,
                event,
            }),
        ))
    },
    test: async ({ platformId, projectId, url, event }: TestParams): Promise<void> => {
        const eventToTest = event ?? ApplicationEventName.FLOW_CREATED
        const mockEvent = buildMockEvent({ event: eventToTest, platformId, projectId })
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        await dispatchEventToDestination({
            log,
            platformId,
            projectId,
            destinationId: apId(),
            destinationUrl: url,
            internalFlowId: toInternalFlowId(matchInternalWebhookUrl({
                destinationUrl: url,
                webhookUrlPrefix,
            })),
            event: mockEvent,
        })
    },
})


// Same-origin handler-flow destinations are dispatched straight to the webhook handler instead of
// making an outbound HTTP POST back to this instance: on self-hosted deployments the instance's own
// hostname resolves to a private/loopback IP and the POST is rejected by the SSRF filter (safeHttp).
// The bypass is tightly scoped — only URLs whose parsed origin exactly equals the instance's
// configured public API origin, whose path sits under /v1/webhooks/, AND whose route suffix is
// rewrite-safe (see INTERNAL_DISPATCH_ROUTE_SUFFIXES) qualify; everything else keeps going through
// the SSRF-protected worker job.
const dispatchEventToDestination = async ({
    log,
    platformId,
    projectId,
    destinationId,
    destinationUrl,
    internalFlowId,
    event,
}: DispatchEventParams): Promise<void> => {
    if (!isNil(internalFlowId)) {
        await dispatchToInternalFlow({
            log,
            destinationId,
            destinationUrl,
            flowId: internalFlowId,
            event,
        })
        return
    }
    await jobQueue(log).add({
        type: JobType.ONE_TIME,
        id: apId(),
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            platformId,
            projectId,
            webhookId: destinationId,
            webhookUrl: destinationUrl,
            payload: event,
            jobType: WorkerJobType.EVENT_DESTINATION,
        },
    })
}

const dispatchToInternalFlow = async ({
    log,
    destinationId,
    destinationUrl,
    flowId,
    event,
}: DispatchToInternalFlowParams): Promise<void> => {
    const { data: response, error } = await tryCatch(async () => webhookService.handleWebhook({
        logger: log,
        flowId,
        async: true,
        saveSampleData: await triggerSourceService(log).existsByFlowId({
            flowId,
            simulate: true,
        }),
        flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
        data: () => Promise.resolve(buildInternalWebhookPayload({ destinationUrl, event })),
        execute: true,
        failParentOnFailure: false,
    }))
    if (error !== null) {
        log.error({
            destination: { id: destinationId },
            flow: { id: flowId },
            error: error.message,
        }, '[eventDestinationService#dispatchToInternalFlow] Failed to dispatch the event to the internal handler flow')
        return
    }
    if (response.status >= StatusCodes.BAD_REQUEST) {
        log.error({
            destination: { id: destinationId },
            flow: { id: flowId },
            response: { status: response.status },
        }, '[eventDestinationService#dispatchToInternalFlow] Internal handler flow did not accept the event — the flow may be deleted or disabled')
    }
}

const buildInternalWebhookPayload = ({ destinationUrl, event }: BuildInternalWebhookPayloadParams): EventPayload => {
    const { data: url } = tryCatchSync(() => new URL(destinationUrl))
    return {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: event,
        queryParams: isNil(url) ? {} : Object.fromEntries(url.searchParams),
    }
}

const classifyDestination = ({ destination, webhookUrlPrefix }: ClassifyDestinationParams): ClassifiedDestination => {
    const match = matchInternalWebhookUrl({
        destinationUrl: destination.url,
        webhookUrlPrefix,
    })
    return {
        destination,
        targetFlowId: isNil(match) ? null : match.flowId,
        internalFlowId: toInternalFlowId(match),
    }
}

const toInternalFlowId = (match: InternalWebhookUrlMatch | null): string | null => {
    if (isNil(match) || !INTERNAL_DISPATCH_ROUTE_SUFFIXES.has(match.routeSuffix)) {
        return null
    }
    return match.flowId
}

// The cycle guard keys off targetFlowId (any same-origin webhook route, regardless of suffix) so
// that a self-targeting '/draft' or '/test' destination is still dropped instead of looping through
// the outbound HTTP path — matching the guard's behavior before internal dispatch existed.
const skipInternalDestinationsOnFlowCycle = ({
    classifiedDestinations,
    event,
    log,
}: SkipDestinationsParams): ClassifiedDestination[] => {
    if (classifiedDestinations.length === 0 || !isFlowRunEvent(event)) {
        return classifiedDestinations
    }
    const targetedFlowIds = new Set(
        classifiedDestinations
            .map(({ targetFlowId }) => targetFlowId)
            .filter((flowId): flowId is string => !isNil(flowId)),
    )
    const eventFlowId = event.data.flowRun.flowId
    if (!targetedFlowIds.has(eventFlowId)) {
        return classifiedDestinations
    }
    log.warn({
        flow: { id: eventFlowId },
        action: event.action,
    }, '[eventDestinationService#trigger] Source flow is wired as an internal webhook target; dropping internal destinations to break the cycle, external destinations will still fire')
    return classifiedDestinations.filter(({ targetFlowId }) => isNil(targetFlowId))
}

const isFlowRunEvent = (
    event: Pick<ApplicationEvent, 'action' | 'data'>,
): event is Pick<FlowRunEvent, 'action' | 'data'> => FLOW_RUN_EVENT_ACTIONS.has(event.action)

const matchInternalWebhookUrl = ({
    destinationUrl,
    webhookUrlPrefix,
}: MatchInternalWebhookUrlParams): InternalWebhookUrlMatch | null => {
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
    if (!flowId) {
        return null
    }
    return {
        flowId,
        routeSuffix: slashIndex === -1 ? '' : destinationWithoutPrefix.slice(slashIndex),
    }
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

type InternalWebhookUrlMatch = {
    flowId: string
    routeSuffix: string
}

type ClassifiedDestination = {
    destination: EventDestinationSchema
    // flow this same-origin webhook URL targets, regardless of route suffix (cycle guard)
    targetFlowId: string | null
    // set only when the route suffix is safe to rewrite to an internal async dispatch
    internalFlowId: string | null
}

type ClassifyDestinationParams = {
    destination: EventDestinationSchema
    webhookUrlPrefix: string
}

type SkipDestinationsParams = {
    classifiedDestinations: ClassifiedDestination[]
    event: ApplicationEvent
    log: FastifyBaseLogger
}

type DispatchEventParams = {
    log: FastifyBaseLogger
    platformId: PlatformId
    projectId?: ProjectId
    destinationId: string
    destinationUrl: string
    internalFlowId: string | null
    event: ApplicationEvent
}

type DispatchToInternalFlowParams = {
    log: FastifyBaseLogger
    destinationId: string
    destinationUrl: string
    flowId: string
    event: ApplicationEvent
}

type BuildInternalWebhookPayloadParams = {
    destinationUrl: string
    event: ApplicationEvent
}

type MatchInternalWebhookUrlParams = {
    destinationUrl: string
    webhookUrlPrefix: string
}
