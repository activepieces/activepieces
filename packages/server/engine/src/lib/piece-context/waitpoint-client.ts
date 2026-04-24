import { CreateWaitpointRequest, CreateWaitpointResponse, EngineGenericError } from '@activepieces/shared'

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
            throw new EngineGenericError('WaitpointCreationError', `Failed to create waitpoint: ${response.status} ${response.statusText}`)
        }
        return response.json() as Promise<CreateWaitpointResponse>
    },
}

type CreateWaitpointClientRequest = CreateWaitpointRequest & {
    apiUrl: string
    engineToken: string
}
