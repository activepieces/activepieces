
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { ApQueueJob, DeleteWebhookSimulationRequest, exceptionHandler, GetRunForWorkerRequest, logger, PollJobRequest, QueueName, ResumeRunRequest, SavePayloadRequest, SendWebhookUpdateRequest, SubmitPayloadsRequest, UpdateJobRequest } from '@activepieces/server-shared'
import { ActivepiecesError, DisableFlowByEngineRequest, ErrorCode, FlowRun, GetFlowVersionForWorkerRequest, GetPieceRequestQuery, PopulatedFlow, UpdateRunProgressRequest } from '@activepieces/shared'
import axios, { isAxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'

const SERVER_URL = 'http://127.0.0.1:3000'

export const workerApiService = (workerToken: string) => {
    const client = axios.create({
        baseURL: SERVER_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${workerToken}`,
        },
    })
    return {
        async poll(queueName: QueueName): Promise<ApQueueJob | null> {
            try {
                const request: PollJobRequest = {
                    queueName,
                }
                const response = await client.get('/v1/workers/poll', {
                    params: request,
                })
                return response.data
            }
            catch (error) {
                logger.trace({
                    message: JSON.stringify(error),
                }, 'Connection refused, retrying in 2 seconds')
                await new Promise((resolve) => setTimeout(resolve, 2000))
                return null
            }
        },
        async resumeRun(request: ResumeRunRequest): Promise<void> {
            await client.post('/v1/workers/resume-run', request)
        },
        async deleteWebhookSimulation(request: DeleteWebhookSimulationRequest): Promise<void> {
            await client.post('/v1/workers/delete-webhook-simulation', request)
        },
        async savePayloadsAsSampleData(request: SavePayloadRequest): Promise<void> {
            return client.post('/v1/workers/save-payloads', request)
        },
        async startRuns(request: SubmitPayloadsRequest): Promise<FlowRun[]> {
            return (await client.post('/v1/workers/submit-payloads', request)).data
        },
        async sendWebhookUpdate(request: SendWebhookUpdateRequest): Promise<void> {
            await client.post('/v1/workers/send-webhook-update', request)
        },
    }
}

export const engineApiService = (engineToken: string) => {
    const client = axios.create({
        baseURL: SERVER_URL,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
    })
    return {
        async getFile(fileId: string): Promise<Buffer> {
            const response = await client.get(`/v1/engine/files/${fileId}`, {
                responseType: 'arraybuffer',
            })
            return response.data
        },
        async updateJobStatus(request: UpdateJobRequest): Promise<void> {
            await client.post('/v1/engine/update-job', request)
        },
        async getRun(request: GetRunForWorkerRequest): Promise<FlowRun> {
            const response = await client.get('/v1/engine/runs/' + request.runId, {})
            return response.data
        },
        async updateRunStatus(request: UpdateRunProgressRequest): Promise<void> {
            await client.post('/v1/engine/update-run', request)
        },
        async removeStaleFlow(request: DisableFlowByEngineRequest): Promise<void> {
            await client.post('/v1/engine/disable-flow', request)
        },
        async getPiece(name: string, options: GetPieceRequestQuery): Promise<PieceMetadataModel> {
            return (await client.get(`/v1/pieces/${encodeURIComponent(name)}`, {
                params: options,
            })).data
        },
        async checkTaskLimit(): Promise<void> {
            try {
                await client.post('/v1/engine/check-task-limit')
            }
            catch (error) {
                if (isAxiosError(error) && error.response && error.response.status === StatusCodes.PAYMENT_REQUIRED) {
                    throw new ActivepiecesError({
                        code: ErrorCode.QUOTA_EXCEEDED,
                        params: {
                            metric: 'tasks',
                        },
                    })
                }
                exceptionHandler.handle(error)
            }
        },
        async getFlowWithExactPieces(request: GetFlowVersionForWorkerRequest): Promise<PopulatedFlow | null> {
            try {
                const response = await client.get('/v1/engine/flows', {
                    params: request,
                })
                return response.data
            }
            catch (error) {
                if (isAxiosError(error) && error.response && error.response.status === 404) {
                    return null
                }
                throw error
            }
        },
    }
}