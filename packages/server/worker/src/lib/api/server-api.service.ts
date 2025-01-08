import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { ApQueueJob, exceptionHandler, GetRunForWorkerRequest, PollJobRequest, QueueName, ResumeRunRequest, SavePayloadRequest, SendEngineUpdateRequest, SubmitPayloadsRequest, UpdateFailureCountRequest, UpdateJobRequest } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, FlowRun, GetFlowVersionForWorkerRequest, GetPieceRequestQuery, PopulatedFlow, RemoveStableJobEngineRequest, UpdateRunProgressRequest, WorkerMachineHealthcheckRequest, WorkerMachineHealthcheckResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { appNetworkUtils } from '../utils/app-network-utils'
import { workerMachine } from '../utils/machine'
import { ApAxiosClient } from './ap-axios'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}



export const workerApiService = (workerToken: string) => {
    const apiUrl = removeTrailingSlash(appNetworkUtils.getInternalApiUrl())

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
            return client.post<FlowRun[]>('/v1/workers/submit-payloads', request)

        },
        async sendUpdate(request: SendEngineUpdateRequest): Promise<void> {
            await client.post('/v1/workers/send-engine-update', request)
        },
    }
}

export const engineApiService = (engineToken: string, log: FastifyBaseLogger) => {
    const apiUrl = removeTrailingSlash(appNetworkUtils.getInternalApiUrl())
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
        async getFlowWithExactPieces(request: GetFlowVersionForWorkerRequest): Promise<PopulatedFlow | null> {
            const startTime = performance.now()
            log.debug({ request }, '[EngineApiService#getFlowWithExactPieces] start')
            //TODO: Add caching logic

            try {
                const flow = await client.get<PopulatedFlow | null>('/v1/engine/flows', {
                    params: request,
                })
              
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
