import { AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION, pinoLogging } from "@activepieces/server-shared"
import { ActivepiecesError, apId, EngineHttpResponse, ErrorCode, EventPayload, Flow, FlowStatus, GetFlowVersionForWorkerRequestType, isMultipartFile, isNil } from "@activepieces/shared"
import { FastifyBaseLogger, FastifyRequest } from "fastify"
import { flowService } from "../flows/flow/flow.service"
import { StatusCodes } from "http-status-codes"
import { engineResponseWatcher } from "../workers/engine-response-watcher"
import { jobQueue } from "../workers/queue"
import { getJobPriority } from "../workers/queue/queue-manager"
import { system } from "../helper/system/system"
import { usageService } from "../ee/platform-billing/usage/usage-service"
import { projectService } from "../project/project-service"
import { stepFileService } from "../file/step-file/step-file.service"

const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000

type WebhookData = {
    isFastifyRequest: true,
    request: FastifyRequest
} | {
    isFastifyRequest: false,
    payload: EventPayload
}
type HandleWebhookParams = {
    flowId: string
    async: boolean
    saveSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined,
    data: WebhookData,
    logger: FastifyBaseLogger
} 


export const webhookService = {
    async handleWebhook({
        logger,
        data,
        flowId,
        async,
        saveSampleData,
        flowVersionToRun,
    }: HandleWebhookParams): Promise<EngineHttpResponse> {
        const webhookHeader = 'x-webhook-id'
        const webhookRequestId = apId()
        const pinoLoger = pinoLogging.createWebhookContextLog({ log: logger, webhookId: webhookRequestId, flowId })
        const flow = await flowService(pinoLoger).getOneById(flowId)
        if (isNil(flow)) {
            pinoLoger.info('Flow not found, returning GONE')
            return {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            }
        }
        await assertExceedsLimit(flow, pinoLoger)
        if (
            flow.status !== FlowStatus.ENABLED &&
            !saveSampleData &&
            flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED
        ) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {
                    [webhookHeader]: webhookRequestId,
                },
            }
        }
    
        pinoLoger.info('Adding webhook job to queue')
    
        const synchronousHandlerId = async ? null : engineResponseWatcher(pinoLoger).getServerId()
        await jobQueue(logger).add({
            id: webhookRequestId,
            type: JobType.WEBHOOK,
            data: {
                projectId: flow.projectId,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                requestId: webhookRequestId,
                synchronousHandlerId,
                payload: data.isFastifyRequest ?  await convertRequest(data.request, flow.projectId, flow.id) : data.payload,
                flowId: flow.id,
                saveSampleData,
                flowVersionToRun,
            },
            priority: await getJobPriority(synchronousHandlerId),
        })
    
        if (async) {
            pinoLoger.info('Async webhook request completed')
            return {
                status: StatusCodes.OK,
                body: {},
                headers: {
                    [webhookHeader]: webhookRequestId,
                },
            }
        }
        const flowHttpResponse = await engineResponseWatcher(pinoLoger).oneTimeListener<EngineHttpResponse>(webhookRequestId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
        return {
            status: flowHttpResponse.status,
            body: flowHttpResponse.body,
            headers: {
                ...flowHttpResponse.headers,
                [webhookHeader]: webhookRequestId,
            },
        }
    }
}

async function assertExceedsLimit(flow: Flow, log: FastifyBaseLogger): Promise<void> {
    const exceededLimit = await usageService(log).tasksExceededLimit(flow.projectId)
    if (!exceededLimit) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
            metric: 'tasks',
        },
    })
}

async function convertBody(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<unknown> {
    if (request.isMultipart()) {
        const jsonResult: Record<string, unknown> = {}
        const requestBodyEntries = Object.entries(
            request.body as Record<string, unknown>,
        )

        const platformId = await projectService.getPlatformId(projectId)

        for (const [key, value] of requestBodyEntries) {
            if (isMultipartFile(value)) {
                const file = await stepFileService(request.log).saveAndEnrich({
                    data: value.data as Buffer,
                    fileName: value.filename,
                    stepName: 'trigger',
                    flowId,
                    contentLength: value.data.length,
                    platformId,
                    projectId,
                })
                jsonResult[key] = file.url
            }
            else {
                jsonResult[key] = value
            }
        }
        return jsonResult
    }
    return request.body
}

async function convertRequest(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<EventPayload> {
    const payload: EventPayload = {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, projectId, flowId),
        queryParams: request.query as Record<string, string>,
    }
    return payload
}


