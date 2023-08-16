import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ErrorCode, EventPayload, ExecutionOutputStatus, Flow, FlowId, FlowRun, StopExecutionOutput, WebhookUrlParams } from '@activepieces/shared'
import { webhookService } from './webhook-service'
import { captureException, logger } from '../helper/logger'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { fileService } from '../file/file.service'
import { isNil } from '@activepieces/shared'
import { flowRepo } from '../flows/flow/flow.repo'

export const webhookController: FastifyPluginAsync = async (app) => {

    app.all(
        '/:flowId/sync',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, reply)
            if (isHandshake) {
                return
            }
            let run = (await webhookService.callback({
                flow,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: await convertBody(request),
                    queryParams: request.query as Record<string, string>,
                },
            }))[0]
            if (isNil(run)) {
                await reply.status(StatusCodes.NOT_FOUND).send()
                return
            }
            run = await waitForRunToComplete(run)
            await handleExecutionOutputStatus(run, reply)
        },
    )

    app.all(
        '/:flowId',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, reply)
            if (isHandshake) {
                return
            }
            asyncHandler(payload, flow)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/',
        {
            schema: {
                querystring: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Querystring: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.query.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, reply)
            if (isHandshake) {
                return
            }
            asyncHandler(payload, flow)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/:flowId/simulate',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            logger.debug(`[WebhookController#simulate] flowId=${request.params.flowId}`)
            const flow = await getFlowOrThrow(request.params.flowId)
            await webhookService.simulationCallback({
                flow,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: await convertBody(request),
                    queryParams: request.query as Record<string, string>,
                },
            })

            await reply.status(StatusCodes.OK).send()
        },
    )
}

const POLLING_INTERVAL_MS = 300
const MAX_POLLING_INTERVAL_MS = 2000
const POLLING_TIMEOUT_MS = 1000 * 30

const waitForRunToComplete = async (run: FlowRun) => {
    const startTime = Date.now()
    let pollingInterval = POLLING_INTERVAL_MS // Initialize with the initial polling interval

    while (run.status === ExecutionOutputStatus.RUNNING) {
        if (Date.now() - startTime >= POLLING_TIMEOUT_MS) {
            break
        }

        run = await flowRunService.getOneOrThrow({
            id: run.id,
            projectId: run.projectId,
        })

        if (run.status === ExecutionOutputStatus.RUNNING) {
            await new Promise((resolve) => setTimeout(resolve, pollingInterval))

            // Increase the polling interval
            if (pollingInterval < MAX_POLLING_INTERVAL_MS) {
                pollingInterval *= 2
                pollingInterval = Math.min(pollingInterval, MAX_POLLING_INTERVAL_MS)
            }
        }
    }

    return run
}

const getResponseForStoppedRun = async (run: FlowRun, reply: FastifyReply) => {
    const logs = await fileService.getOneOrThrow({
        fileId: run.logsFileId!,
        projectId: run.projectId,
    })

    const flowLogs: StopExecutionOutput = JSON.parse(logs.data.toString())

    await reply
        .status(flowLogs.stopResponse?.status ?? StatusCodes.OK)
        .send(flowLogs.stopResponse?.body)
        .headers(flowLogs.stopResponse?.headers ?? {})
}

const handleExecutionOutputStatus = async (run: FlowRun, reply: FastifyReply) => {
    if (run.status === ExecutionOutputStatus.STOPPED) {
        await getResponseForStoppedRun(run, reply)
    }
    else {
        await reply.status(StatusCodes.NO_CONTENT).send()
    }
}

async function convertRequest(request: FastifyRequest): Promise<EventPayload> {
    const payload: EventPayload = {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request),
        queryParams: request.query as Record<string, string>,
    }
    return payload
}

const convertBody = async (request: FastifyRequest) => {
    if (request.isMultipart()) {
        const jsonResult: Record<string, unknown> = {}
        const parts = request.parts()
        for await (const part of parts) {
            if (part.type === 'file') {
                const chunks = []
                for await (const chunk of part.file) {
                    chunks.push(chunk)
                }
                const fileBuffer = Buffer.concat(chunks)
                jsonResult[part.fieldname] = fileBuffer.toString('base64')
            }
            else {
                jsonResult[part.fieldname] = part.value
            }
        }
        return jsonResult
    }
    return request.body

}

async function handshakeHandler(flow: Flow, payload: EventPayload, reply: FastifyReply): Promise<boolean> {
    const handshakeResponse = await webhookService.handshake({
        flow,
        payload,
    })
    if (handshakeResponse !== null) {
        reply = reply.status(handshakeResponse.status)
        if (handshakeResponse.headers !== undefined) {
            for (const header of Object.keys(handshakeResponse.headers)) {
                reply = reply.header(header, handshakeResponse.headers[header] as string)
            }
        }
        await reply.send(handshakeResponse.body)
        return true
    }
    return false
}

const asyncHandler = async (payload: EventPayload, flow: Flow) => {
    // If we don't catch the error here, it will crash the Fastify API. Adding await before the function call can help, but since 3P services expect a fast response, we still don't want to wait for the callback to finish.
    try {
        await webhookService.callback({
            flow,
            payload,
        })
    }
    catch (e) {
        captureException(e)
    }
}

const getFlowOrThrow = async (flowId: FlowId): Promise<Flow> => {
    if (isNil(flowId)) {
        logger.error('[WebhookService#getFlowOrThrow] error=flow_id_is_undefined')
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'flowId is undefined',
            },
        })
    }

    const flow = await flowRepo.findOneBy({ id: flowId })

    if (isNil(flow)) {
        logger.error(`[WebhookService#getFlowOrThrow] error=flow_not_found flowId=${flowId}`)

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    return flow
}
