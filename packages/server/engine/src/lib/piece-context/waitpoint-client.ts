import { CreateWaitpointRequest, CreateWaitpointResponse, SealFanInBarrierRequest, SealFanInBarrierResponse } from '@activepieces/shared'
import { throwForRejectedRequest } from './rejected-request'

export const waitpointClient = {
    create: async ({ apiUrl, engineToken, ...body }: CreateWaitpointClientRequest): Promise<CreateWaitpointResponse> => {
        const response = await fetch(`${apiUrl}v1/waitpoints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            await throwForRejectedRequest({ response, name: 'WaitpointCreationError', summary: 'Failed to create waitpoint' })
        }
        return response.json() as Promise<CreateWaitpointResponse>
    },
    seal: async ({ apiUrl, engineToken, waitpointId, ...body }: SealFanInBarrierClientRequest): Promise<SealFanInBarrierResponse> => {
        const response = await fetch(`${apiUrl}v1/waitpoints/${waitpointId}/seal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            await throwForRejectedRequest({ response, name: 'FanInBarrierSealError', summary: 'Failed to seal fan-in barrier' })
        }
        return response.json() as Promise<SealFanInBarrierResponse>
    },
}

type CreateWaitpointClientRequest = CreateWaitpointRequest & {
    apiUrl: string
    engineToken: string
}

type SealFanInBarrierClientRequest = SealFanInBarrierRequest & {
    apiUrl: string
    engineToken: string
    waitpointId: string
}
