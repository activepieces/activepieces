
import { PopulatedFlow, UpdateRunProgressRequest } from '@activepieces/shared'
import axios, { isAxiosError } from 'axios'

const SERVER_URL = 'http://127.0.0.1:3000'

export const serverApiService = (workerToken: string) => {
    const client = axios.create({
        baseURL: SERVER_URL,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${workerToken}`,
        },
    })

    return {
        async updateRunStatus(request: UpdateRunProgressRequest): Promise<void> {
            await client.post('/v1/worker/flows/update-run', request)
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