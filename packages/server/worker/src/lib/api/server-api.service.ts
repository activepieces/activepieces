
import { ApQueueJob, PollJobRequest, QueueName, logger } from '@activepieces/server-shared'
import { PopulatedFlow, UpdateRunProgressRequest } from '@activepieces/shared'
import axios, { isAxiosError } from 'axios'

const SERVER_URL = 'http://127.0.0.1:3000'

export const workerApiService = () => {
    const client = axios.create({
        baseURL: SERVER_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    })
    return {
        async poll(queueName: QueueName): Promise<ApQueueJob | null> {
            try {
                const request: PollJobRequest = {
                    queueName: queueName,
                }
                const response = await client.get('/v1/flow-workers/poll', {
                    params: request,
                })
                return response.data
            }
            catch (error) {
                logger.error({
                    message: JSON.stringify(error)
                }, `Failed to poll new jobs, retrying in 2 seconds`);
                await new Promise((resolve) => setTimeout(resolve, 2000))
                return null
            }
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
        async updateRunStatus(request: UpdateRunProgressRequest): Promise<void> {
            await client.post('/v1/worker/flows/update-run', request)
        },
        async updateJobStatus(queueName: QueueName, status: string, message: string): Promise<void> {
            await client.post('/v1/flow-workers/update', {
                queueName: queueName,
                status: status,
                message: message,
            })
        },
        async getFlowWithExactPieces(flowVersionId: string): Promise<PopulatedFlow | null> {
            try {
                const response = await client.get('/v1/worker/flows', {
                    params: {
                        versionId: flowVersionId,
                    },
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