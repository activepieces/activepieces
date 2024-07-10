
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { ApQueueJob, DeleteWebhookSimulationRequest, exceptionHandler, GetRunForWorkerRequest, networkUtls, PollJobRequest, QueueName, ResumeRunRequest, SavePayloadRequest, SendWebhookUpdateRequest, SubmitPayloadsRequest, UpdateJobRequest } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, FlowRun, GetFlowVersionForWorkerRequest, GetPieceRequestQuery, PopulatedFlow, RemoveStableJobEngineRequest, UpdateRunProgressRequest, WorkerMachineHealthcheckRequest } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { heartbeat } from '../utils/heartbeat'
import { ApAxiosClient } from './ap-axios'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}
const apiUrl = removeTrailingSlash(networkUtls.getInternalApiUrl())

export const workerApiService = (workerToken: string) => {
    const client = new ApAxiosClient(apiUrl, workerToken)

    return {
        async heartbeat(): Promise<void> {
            const request: WorkerMachineHealthcheckRequest = await heartbeat.getSystemInfo()
            await client.post('/v1/worker-machines/heartbeat', request)
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
        async deleteWebhookSimulation(request: DeleteWebhookSimulationRequest): Promise<void> {
            await client.post('/v1/workers/delete-webhook-simulation', request)
        },
        async savePayloadsAsSampleData(request: SavePayloadRequest): Promise<void> {
            await client.post('/v1/workers/save-payloads', request)
        },
        async startRuns(request: SubmitPayloadsRequest): Promise<FlowRun[]> {
            return  client.post<FlowRun[]>('/v1/workers/submit-payloads', request)

        },
        async sendWebhookUpdate(request: SendWebhookUpdateRequest): Promise<void> {
            await client.post('/v1/workers/send-webhook-update', request)
        },
    }
}

export const engineApiService = (engineToken: string) => {

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
                exceptionHandler.handle(e)
            }
        },
        async getFlowWithExactPieces(request: GetFlowVersionForWorkerRequest): Promise<PopulatedFlow | null> {
            try {
                return await client.get<PopulatedFlow | null>('/v1/engine/flows', {
                    params: request,
                })
            }
            catch (e) {
                if (ApAxiosClient.isApAxiosError(e) && e.error.response && e.error.response.status === 404) {
                    return null
                }
                throw e
            }
        },
    }
}

