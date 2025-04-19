import fs from 'fs/promises'
import path from 'path'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { ApQueueJob, exceptionHandler, GetRunForWorkerRequest, PollJobRequest, QueueName, ResumeRunRequest, SavePayloadRequest, SendEngineUpdateRequest, SubmitPayloadsRequest, UpdateFailureCountRequest, UpdateJobRequest } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, FlowRun, FlowVersionId, FlowVersionState, GetFlowVersionForWorkerRequest, GetPieceRequestQuery, isNil, PopulatedFlow, RemoveStableJobEngineRequest, UpdateRunProgressRequest, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import pLimit from 'p-limit'
import { workerMachine } from '../utils/machine'
import { ApAxiosClient } from './ap-axios'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

export const workerApiService = (workerToken: string) => {
    const apiUrl = removeTrailingSlash(workerMachine.getInternalApiUrl())

    const client = new ApAxiosClient(apiUrl, workerToken)

    return {
        async heartbeat(): Promise<WorkerMachineHealthcheckResponse | null> {
            const request: WorkerMachineHealthcheckRequest = await workerMachine.getSystemInfo()
            try {
                return await client.post<WorkerMachineHealthcheckResponse>('/v1/worker-machines/heartbeat', request)
            }
            catch (error) {
                if (ApAxiosClient.isApAxiosError(error) && error.error.code === 'ECONNREFUSED') {
                    return null
                }
                throw error
            }
        },
        async poll(queueName: QueueName): Promise<ApQueueJob | null> {
            try {
                const request: PollJobRequest = {
                    queueName,
                }
                const response = await client.get<ApQueueJob | null>('/v1/workers/poll', {
                    params: request,
                })
                return response
            }
            catch (error) {
                await new Promise((resolve) => setTimeout(resolve, 2000))
                return null
            }
        },
        async resumeRun(request: ResumeRunRequest): Promise<void> {
            await client.post<unknown>('/v1/workers/resume-run', request)
        },
        async savePayloadsAsSampleData(request: SavePayloadRequest): Promise<void> {
            await client.post('/v1/workers/save-payloads', request)
        },
        async startRuns(request: SubmitPayloadsRequest): Promise<FlowRun[]> {
            const arrayOfPayloads = splitPayloadsIntoOneMegabyteBatches(request.payloads)
            const limit = pLimit(1)
            const promises = arrayOfPayloads.map(payloads =>
                limit(() => client.post<FlowRun[]>('/v1/workers/submit-payloads', {
                    ...request,
                    payloads,
                })),
            )

            const results = await Promise.allSettled(promises)
            const errors = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')

            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.reason.message).join(', ')
                throw new Error(`Failed to start runs: ${errorMessages}`)
            }

            return results
                .filter((r): r is PromiseFulfilledResult<FlowRun[]> => r.status === 'fulfilled')
                .map(r => r.value)
                .flat()
        },
        async sendUpdate(request: SendEngineUpdateRequest): Promise<void> {
            await client.post('/v1/workers/send-engine-update', request)
        },
    }
}

function splitPayloadsIntoOneMegabyteBatches(payloads: unknown[]): unknown[][] {
    const batches: unknown[][] = [[]]
    const ONE_MB = 1024 * 1024
    let currentSize = 0
    for (const payload of payloads) {
        const payloadSize = Buffer.byteLength(JSON.stringify(payload))
        currentSize += payloadSize

        if (currentSize > ONE_MB) {
            batches.push([])
            currentSize = payloadSize
        }

        batches[batches.length - 1].push(payload)
    }

    return batches
}

const globalCacheFlowPath = path.resolve('cache', 'flows')

async function readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8')
}

async function writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content)
}

async function readFlowFromCache(flowVersionIdToRun: FlowVersionId | null | undefined): Promise<PopulatedFlow | null> {
    try {
        if (flowVersionIdToRun) {
            const cachedFlow = await readFile(path.resolve(globalCacheFlowPath, flowVersionIdToRun))
            return JSON.parse(cachedFlow) as PopulatedFlow
        }
        return null
    }
    catch (error) {
        return null
    }
}

async function cacheFlow(flow: PopulatedFlow): Promise<void> {
    if (flow.version.state === FlowVersionState.LOCKED) {
        await writeFile(path.resolve(globalCacheFlowPath, flow.version.id), JSON.stringify(flow))
    }
}

export const engineApiService = (engineToken: string, log: FastifyBaseLogger) => {
    const apiUrl = removeTrailingSlash(workerMachine.getInternalApiUrl())
    const client = new ApAxiosClient(apiUrl, engineToken)

    return {
        async getFile(fileId: string): Promise<Buffer> {
            return client.get<Buffer>(`/v1/engine/files/${fileId}`, {
                responseType: 'arraybuffer',
            })
        },
        async updateJobStatus(request: UpdateJobRequest): Promise<void> {
            await client.post('/v1/engine/update-job', request)
        },
        async updateFailureCount(request: UpdateFailureCountRequest): Promise<void> {
            await client.post('/v1/engine/update-failure-count', request)
        },
        async getRun(request: GetRunForWorkerRequest): Promise<FlowRun> {
            return client.get<FlowRun>('/v1/engine/runs/' + request.runId, {})
        },
        async updateRunStatus(request: UpdateRunProgressRequest): Promise<void> {
            await client.post('/v1/engine/update-run', request)
        },
        async removeStaleFlow(request: RemoveStableJobEngineRequest): Promise<void> {
            await client.post('/v1/engine/remove-stale-job', request)
        },
        async getPiece(name: string, options: GetPieceRequestQuery): Promise<PieceMetadataModel> {
            return client.get<PieceMetadataModel>(`/v1/pieces/${encodeURIComponent(name)}`, {
                params: options,
            })
        },
        async checkTaskLimit(): Promise<void> {
            try {
                await client.get<unknown>('/v1/engine/check-task-limit', {})
            }
            catch (e) {
                if (ApAxiosClient.isApAxiosError(e) && e.error.response && e.error.response.status === StatusCodes.PAYMENT_REQUIRED) {
                    throw new ActivepiecesError({
                        code: ErrorCode.QUOTA_EXCEEDED,
                        params: {
                            metric: 'tasks',
                        },
                    })
                }
                exceptionHandler.handle(e, log)
            }
        },
        async getFlowWithExactPieces(request: GetFlowVersionForWorkerRequest, flowVersionIdToRun: FlowVersionId | null | undefined): Promise<PopulatedFlow | null> {
            const startTime = performance.now()
            log.debug({ request }, '[EngineApiService#getFlowWithExactPieces] start')

            const cachedFlow = await readFlowFromCache(flowVersionIdToRun)
            if (cachedFlow) {
                log.debug({ request, took: performance.now() - startTime }, '[EngineApiService#getFlowWithExactPieces] cache hit')
                return cachedFlow
            }

            try {
                const flow = await client.get<PopulatedFlow | null>('/v1/engine/flows', {
                    params: request,
                })

                if (!isNil(flow)) {
                    await cacheFlow(flow)
                }

                return flow
            }
            catch (e) {
                if (ApAxiosClient.isApAxiosError(e) && e.error.response && e.error.response.status === 404) {
                    return null
                }
                throw e
            }
            finally {
                log.debug({ request, took: performance.now() - startTime }, '[EngineApiService#getFlowWithExactPieces] cache miss')
            }
        },
    }
}
