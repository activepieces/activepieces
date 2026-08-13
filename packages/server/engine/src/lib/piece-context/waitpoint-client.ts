import { CreateWaitpointRequest, CreateWaitpointResponse } from '@activepieces/shared'
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
}

type CreateWaitpointClientRequest = CreateWaitpointRequest & {
    apiUrl: string
    engineToken: string
}
