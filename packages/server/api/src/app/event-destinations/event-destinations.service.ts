import { ActivepiecesError, apId, Cursor, ErrorCode, isNil, partition, PlatformId, ProjectId, sanitizeObjectForPostgresql, SeekPage, spreadIfDefined, spreadIfNotUndefined, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { AgentRunSource, ApplicationEvent, ApplicationEventName, buildMockEvent, CreatePlatformEventDestinationRequestBody, DestinationType, EventDestination, EventDestinationHeaders, EventDestinationHeadersRequest, EventDestinationMapper, EventDestinationScope, EventPayload, FlowRunEvent, LATEST_JOB_DATA_SCHEMA_VERSION, TestPlatformEventDestinationResponse, UpdatePlatformEventDestinationRequestBody, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ArrayContains, FindOptionsWhere } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { applicationEvents } from '../helper/application-events'
import { domainHelper } from '../helper/domain-helper'
import { EncryptedObject, encryptUtils } from '../helper/encryption'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { projectService } from '../project/project-service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { WebhookFlowVersionToRun, webhookService } from '../webhooks/webhook.service'
import { jobQueue, JobType } from '../workers/job-queue/job-queue'
import { renderEventBody } from './event-body-renderer'
import { eventDestinationHooks } from './event-destinations-hooks'
import {
    EventDestinationEntity,
    EventDestinationRow,
    EventDestinationSchema,
    StoredEventDestinationHeaders,
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

const WEBHOOK_PATH_MARKER = '/v1/webhooks/'

const MILLISECONDS_PER_SECOND = 1000

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
    create: async ({ request, platformId }: CreateParams): Promise<EventDestination> => {
        const entity: EventDestinationRow = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            platformId,
            scope: EventDestinationScope.PLATFORM,
            events: request.events,
            url: request.url,
            name: request.name ?? null,
            type: request.type ?? DestinationType.CUSTOM,
            enabled: request.enabled ?? true,
            mapper: isNil(request.mapper) ? null : sanitizeObjectForPostgresql(request.mapper),
            headers: await toStoredHeaders({ requested: request.headers, stored: {} }),
        }
        const saved = await eventDestinationRepo().save(entity)
        return maskHeaders({ row: saved, log })
    },
    update: async ({ id, platformId, request }: UpdateParams): Promise<EventDestination> => {
        const stored = await eventDestinationRepo().findOneByOrFail({ id, platformId })
        const { headers: requestedHeaders, ...rest } = request
        const sanitizedRest = isNil(rest.mapper) ? rest : { ...rest, mapper: sanitizeObjectForPostgresql(rest.mapper) }
        const storedHeaderCiphertexts = parseStoredHeaders({ headers: stored.headers, destinationId: stored.id, log })
        assertUrlChangeRebindsStoredHeaders({
            requested: requestedHeaders,
            stored: storedHeaderCiphertexts,
            urlChanged: rest.url !== stored.url,
        })
        const headers = requestedHeaders === undefined
            ? undefined
            : await toStoredHeaders({
                requested: requestedHeaders,
                stored: storedHeaderCiphertexts,
            })
        await eventDestinationRepo().save({
            id: stored.id,
            ...sanitizedRest,
            ...spreadIfNotUndefined('headers', headers),
            updated: new Date().toISOString(),
        })
        const updated = await eventDestinationRepo().findOneByOrFail({ id, platformId })
        return maskHeaders({ row: updated, log })
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
        const masked = data.map((row) => maskHeaders({ row, log }))

        return paginationHelper.createPage<EventDestination>(masked, cursor)
    },
    trigger: async ({ projectId, event }: TriggerParams): Promise<void> => {
        const platformId = event.platformId
        const conditions: FindOptionsWhere<EventDestinationSchema>[] = [{
            platformId,
            events: ArrayContains([event.action]),
            scope: EventDestinationScope.PLATFORM,
            enabled: true,
        }]
        const broadcastToProject = !isNil(projectId) && PROJECT_SCOPE_EVENTS.includes(event.action)
        if (broadcastToProject) {
            conditions.push({
                platformId,
                projectId,
                events: ArrayContains([event.action]),
                scope: EventDestinationScope.PROJECT,
                enabled: true,
            })
        }
        const destinations = await eventDestinationRepo().findBy(conditions)
        if (destinations.length === 0) {
            return
        }
        const { data: entitled, error: entitlementError } = await tryCatch(() => eventDestinationHooks.get(log).isDeliveryEntitled({ platformId }))
        if (!isNil(entitlementError)) {
            log.warn({ error: entitlementError, platform: { id: platformId } }, 'Failed to resolve event streaming entitlement, dropping the event')
            return
        }
        if (!entitled) {
            return
        }
        const { data: enrichment, error: enrichmentError } = await tryCatch(() => enrichFlowRunEvent({ event, log }))
        if (!isNil(enrichmentError)) {
            log.warn({ error: enrichmentError, platform: { id: platformId } }, 'Failed to enrich flow run event, sending the raw event')
        }
        const enrichedEvent = enrichment ?? event
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const classifiedDestinations = destinations.map((destination) =>
            classifyDestination({ destination, webhookUrlPrefix }))
        const destinationsToDispatch = skipInternalDestinationsOnFlowCycle({
            classifiedDestinations,
            event: enrichedEvent,
            log,
        })
        await Promise.all(destinationsToDispatch.map(async ({ destination, internalFlowId }) =>
            dispatchEventToDestination({
                log,
                platformId,
                projectId,
                destinationId: destination.id,
                destinationUrl: destination.url,
                internalFlowId,
                body: renderEventBody({
                    mapper: destination.mapper,
                    event: enrichedEvent,
                    destinationId: destination.id,
                    log,
                }),
            }),
        ))
    },
    resolveDeliveryHeaders: async ({ platformId, destinationId }: ResolveDeliveryHeadersParams): Promise<EventDestinationHeaders | null> => {
        const destination = await eventDestinationRepo().findOneBy({ id: destinationId, platformId })
        if (isNil(destination)) {
            return null
        }
        return decryptHeaders({ headers: destination.headers, destinationId: destination.id, log })
    },
    test: async ({ platformId, projectId, url, event, mapper, headers }: TestParams): Promise<TestPlatformEventDestinationResponse> => {
        const eventToTest = event ?? ApplicationEventName.FLOW_CREATED
        const mockEvent = buildMockEvent({ event: eventToTest, platformId, projectId })
        const renderedBody = renderEventBody({ mapper, event: mockEvent, log })
        const resolvedHeaders = headers ?? {}
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const internalFlowId = matchInternalWebhookFlowId({
            destinationUrl: url,
            webhookUrlPrefix,
        })
        const startedAt = Date.now()
        const outcome = isNil(internalFlowId)
            ? await postToDestination({ url, body: renderedBody, headers: resolvedHeaders })
            : await dispatchToInternalFlow({
                log,
                destinationId: apId(),
                destinationUrl: url,
                flowId: internalFlowId,
                body: renderedBody,
            })
        return {
            renderedBody,
            durationMs: Date.now() - startedAt,
            ...outcome,
        }
    },
})


function parseStoredHeaders({ headers, destinationId, log }: ParseStoredHeadersParams): StoredEventDestinationHeaders {
    if (isNil(headers)) {
        return {}
    }
    const parsed = StoredEventDestinationHeaders.safeParse(headers)
    if (!parsed.success) {
        log.warn({ destination: { id: destinationId } }, '[eventDestinationService#parseStoredHeaders] Stored headers are unreadable and are treated as empty')
        return {}
    }
    return parsed.data
}

function assertUrlChangeRebindsStoredHeaders({ requested, stored, urlChanged }: AssertUrlChangeRebindsStoredHeadersParams): void {
    const storedNames = Object.keys(stored)
    if (!urlChanged || storedNames.length === 0) {
        return
    }
    const carriedOverNames = requested === undefined
        ? storedNames
        : storedNames.filter((name) => !isNil(requested) && name in requested && isNil(requested[name]))
    if (carriedOverNames.length === 0) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.EVENT_DESTINATION_URL_CHANGE_REQUIRES_HEADERS,
        params: { headerNames: carriedOverNames },
    })
}

async function toStoredHeaders({ requested, stored }: ToStoredHeadersParams): Promise<StoredEventDestinationHeaders | null> {
    if (isNil(requested)) {
        return null
    }
    const entries = await Promise.all(
        Object.entries(requested).map(async ([key, value]): Promise<[string, EncryptedObject] | null> => {
            if (!isNil(value)) {
                return [key, await encryptUtils.encryptString(value)]
            }
            const keptCiphertext = stored[key]
            return isNil(keptCiphertext) ? null : [key, keptCiphertext]
        }),
    )
    const resolved = entries.filter((entry): entry is [string, EncryptedObject] => !isNil(entry))
    return resolved.length === 0 ? null : Object.fromEntries(resolved)
}

async function decryptHeaders({ headers, destinationId, log }: DecryptHeadersParams): Promise<EventDestinationHeaders> {
    const stored = parseStoredHeaders({ headers, destinationId, log })
    const entries = await Promise.all(
        Object.entries(stored).map(async ([key, value]): Promise<[string, string]> => [key, await encryptUtils.decryptString(value)]),
    )
    return Object.fromEntries(entries)
}

function maskHeaders({ row, log }: MaskHeadersParams): EventDestination {
    const keys = Object.keys(parseStoredHeaders({ headers: row.headers, destinationId: row.id, log }))
    return {
        ...row,
        headers: keys.length === 0
            ? null
            : Object.fromEntries(keys.map((key) => [key, null])),
    }
}

const dispatchEventToDestination = async ({
    log,
    platformId,
    projectId,
    destinationId,
    destinationUrl,
    internalFlowId,
    body,
}: DispatchEventParams): Promise<void> => {
    if (!isNil(internalFlowId)) {
        await dispatchToInternalFlow({
            log,
            destinationId,
            destinationUrl,
            flowId: internalFlowId,
            body,
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
            payload: body,
            jobType: WorkerJobType.EVENT_DESTINATION,
        },
    })
}

const postToDestination = async ({ url, body, headers }: PostToDestinationParams): Promise<DeliveryOutcome> => {
    const timeoutInSeconds = system.getNumberOrThrow(AppSystemProp.EVENT_DESTINATION_TIMEOUT_SECONDS)
    const { data: response, error } = await tryCatch(() => safeHttp.axios.request({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        data: body,
        timeout: timeoutInSeconds * MILLISECONDS_PER_SECOND,
        validateStatus: () => true,
    }))
    if (error !== null) {
        return { error: error.message }
    }
    return { status: response.status }
}

const dispatchToInternalFlow = async ({
    log,
    destinationId,
    destinationUrl,
    flowId,
    body,
}: DispatchToInternalFlowParams): Promise<DeliveryOutcome> => {
    const routeSuffix = webhookRouteSuffix({ destinationUrl, flowId })
    const isDraftOrTest = routeSuffix.startsWith('/draft') || routeSuffix === '/test'
    const { data: response, error } = await tryCatch(async () => webhookService.handleWebhook({
        logger: log,
        flowId,
        async: true,
        saveSampleData: isDraftOrTest
            ? true
            : await triggerSourceService(log).existsByFlowId({
                flowId,
                simulate: true,
            }),
        flowVersionToRun: isDraftOrTest
            ? WebhookFlowVersionToRun.LATEST
            : WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
        data: () => Promise.resolve(buildInternalWebhookPayload({ destinationUrl, body })),
        execute: routeSuffix !== '/test',
        failParentOnFailure: false,
    }))
    if (error !== null) {
        log.error({
            destination: { id: destinationId },
            flow: { id: flowId },
            error: error.message,
        }, '[eventDestinationService#dispatchToInternalFlow] Failed to dispatch the event to the internal handler flow')
        return { error: error.message }
    }
    if (response.status >= StatusCodes.BAD_REQUEST) {
        log.error({
            destination: { id: destinationId },
            flow: { id: flowId },
            response: { status: response.status },
        }, '[eventDestinationService#dispatchToInternalFlow] Internal handler flow did not accept the event — the flow may be deleted or disabled')
    }
    return { status: response.status }
}

const buildInternalWebhookPayload = ({ destinationUrl, body }: BuildInternalWebhookPayloadParams): EventPayload => {
    const { data: url } = tryCatchSync(() => new URL(destinationUrl))
    return {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body,
        queryParams: isNil(url) ? {} : Object.fromEntries(url.searchParams),
    }
}

const classifyDestination = ({ destination, webhookUrlPrefix }: ClassifyDestinationParams): ClassifiedDestination => ({
    destination,
    internalFlowId: matchInternalWebhookFlowId({
        destinationUrl: destination.url,
        webhookUrlPrefix,
    }),
})

const skipInternalDestinationsOnFlowCycle = ({
    classifiedDestinations,
    event,
    log,
}: SkipDestinationsParams): ClassifiedDestination[] => {
    const origin = flowBehindEventOf(event)
    if (isNil(origin)) {
        return classifiedDestinations
    }
    if (isNil(origin.flowId)) {
        return dropWebhookFlowDestinations({
            classifiedDestinations,
            event,
            log,
            message: '[eventDestinationService#trigger] This agent action ran inside a flow that could not be named; dropping every webhook-flow destination to break a possible cycle, non-webhook destinations will still fire',
        })
    }
    const targetsEventFlow = classifiedDestinations.some(({ destination }) =>
        extractWebhookFlowIdCandidate({ destinationUrl: destination.url }) === origin.flowId)
    if (!targetsEventFlow) {
        return classifiedDestinations
    }
    return dropWebhookFlowDestinations({
        classifiedDestinations,
        event,
        log,
        flowId: origin.flowId,
        message: '[eventDestinationService#trigger] Source flow is wired as a webhook-flow destination; dropping all webhook-flow destinations to break the cycle, non-webhook destinations will still fire',
    })
}

const dropWebhookFlowDestinations = ({ classifiedDestinations, event, log, flowId, message }: DropWebhookFlowDestinationsParams): ClassifiedDestination[] => {
    const [keptDestinations, droppedDestinations] = partition(classifiedDestinations, ({ destination }) =>
        isNil(extractWebhookFlowIdCandidate({ destinationUrl: destination.url })))
    if (droppedDestinations.length > 0) {
        log.warn({
            ...spreadIfDefined('flow', isNil(flowId) ? undefined : { id: flowId }),
            action: event.action,
            droppedDestinations: droppedDestinations.map(({ destination }) => ({ id: destination.id, url: destination.url })),
        }, message)
    }
    return keptDestinations
}

const flowBehindEventOf = (event: Pick<ApplicationEvent, 'action' | 'data'>): { flowId?: string } | undefined => {
    if (isFlowRunEvent(event)) {
        return { flowId: event.data.flowRun.flowId }
    }
    if (event.action !== ApplicationEventName.AGENT_ACTION_EXECUTED || !('source' in event.data) || event.data.source !== AgentRunSource.FLOW_STEP) {
        return undefined
    }
    return { ...spreadIfDefined('flowId', event.data.flow?.id) }
}

const isFlowRunEvent = (
    event: Pick<ApplicationEvent, 'action' | 'data'>,
): event is Pick<FlowRunEvent, 'action' | 'data'> => FLOW_RUN_EVENT_ACTIONS.has(event.action)

const extractWebhookFlowIdCandidate = ({ destinationUrl }: ExtractWebhookFlowIdCandidateParams): string | null => {
    const { data: url } = tryCatchSync(() => new URL(destinationUrl))
    if (isNil(url)) {
        return null
    }
    const markerIndex = url.pathname.lastIndexOf(WEBHOOK_PATH_MARKER)
    if (markerIndex === -1) {
        return null
    }
    const rawFlowId = url.pathname.slice(markerIndex + WEBHOOK_PATH_MARKER.length).split('/')[0]
    if (!rawFlowId) {
        return null
    }
    const { data: decodedFlowId } = tryCatchSync(() => decodeURIComponent(rawFlowId))
    return decodedFlowId ?? rawFlowId
}

const enrichFlowRunEvent = async ({ event, log }: EnrichFlowRunEventParams): Promise<ApplicationEvent> => {
    const projectId = event.projectId
    if (!isFlowRunEvent(event)) {
        return event
    }
    const [flowVersion, project] = await Promise.all([
        flowVersionService(log).getOne(event.data.flowRun.flowVersionId),
        isNil(projectId) ? Promise.resolve(null) : projectService(log).getOne(projectId),
    ])
    return {
        ...event,
        ...spreadIfDefined('projectDisplayName', project?.displayName ?? event.projectDisplayName),
        data: {
            ...event.data,
            flowRun: {
                ...event.data.flowRun,
                flowDisplayName: flowVersion?.displayName ?? event.data.flowRun.flowDisplayName,
            },
            ...(isNil(project) ? {} : { project: { displayName: project.displayName } }),
        },
    }
}

const matchInternalWebhookFlowId = ({
    destinationUrl,
    webhookUrlPrefix,
}: MatchInternalWebhookFlowIdParams): string | null => {
    const { data: destination } = tryCatchSync(() => new URL(destinationUrl))
    const { data: prefix } = tryCatchSync(() => new URL(webhookUrlPrefix))
    if (isNil(destination) || isNil(prefix) || destination.origin !== prefix.origin) {
        return null
    }
    const prefixPath = prefix.pathname + '/'
    if (!destination.pathname.startsWith(prefixPath)) {
        return null
    }
    const flowId = destination.pathname.slice(prefixPath.length).split('/')[0]
    return flowId || null
}

const webhookRouteSuffix = ({ destinationUrl, flowId }: WebhookRouteSuffixParams): string => {
    const { data: url } = tryCatchSync(() => new URL(destinationUrl))
    if (isNil(url)) {
        return ''
    }
    const flowIdSegment = `/${flowId}`
    const flowIdIndex = url.pathname.indexOf(flowIdSegment)
    return flowIdIndex === -1 ? '' : url.pathname.slice(flowIdIndex + flowIdSegment.length)
}


type ParseStoredHeadersParams = {
    headers: StoredEventDestinationHeaders | null
    destinationId: string
    log: FastifyBaseLogger
}

type AssertUrlChangeRebindsStoredHeadersParams = {
    requested: EventDestinationHeadersRequest | null | undefined
    stored: StoredEventDestinationHeaders
    urlChanged: boolean
}

type ToStoredHeadersParams = {
    requested: EventDestinationHeadersRequest | null | undefined
    stored: StoredEventDestinationHeaders
}

type DecryptHeadersParams = ParseStoredHeadersParams

type MaskHeadersParams = {
    row: EventDestinationRow
    log: FastifyBaseLogger
}

type DeleteParams = {
    id: string
    platformId: string
}

type CreateParams = {
    request: CreatePlatformEventDestinationRequestBody
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
    mapper?: EventDestinationMapper | null
    headers?: EventDestinationHeaders | null
}

type DeliveryOutcome = {
    status?: number
    error?: string
}

type PostToDestinationParams = {
    url: string
    body: unknown
    headers: EventDestinationHeaders
}

type EnrichFlowRunEventParams = {
    event: ApplicationEvent
    log: FastifyBaseLogger
}

type ClassifiedDestination = {
    destination: EventDestinationSchema
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

type DropWebhookFlowDestinationsParams = SkipDestinationsParams & {
    flowId?: string
    message: string
}

type DispatchEventParams = {
    log: FastifyBaseLogger
    platformId: PlatformId
    projectId?: ProjectId
    destinationId: string
    destinationUrl: string
    internalFlowId: string | null
    body: unknown
}

type ResolveDeliveryHeadersParams = {
    platformId: PlatformId
    destinationId: string
}

type DispatchToInternalFlowParams = {
    log: FastifyBaseLogger
    destinationId: string
    destinationUrl: string
    flowId: string
    body: unknown
}

type BuildInternalWebhookPayloadParams = {
    destinationUrl: string
    body: unknown
}

type ExtractWebhookFlowIdCandidateParams = {
    destinationUrl: string
}

type MatchInternalWebhookFlowIdParams = {
    destinationUrl: string
    webhookUrlPrefix: string
}

type WebhookRouteSuffixParams = {
    destinationUrl: string
    flowId: string
}
