import { tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { CreateWaitpointRequest, CreateWaitpointResponse, EngineGenericError, SealFanInBarrierRequest, SealFanInBarrierResponse, WaitpointRejectedError } from '@activepieces/shared'
import { z } from 'zod'

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

const rejectionBodySchema = z.object({
    params: z.object({ message: z.string().optional() }).optional(),
    message: z.string().optional(),
})

async function throwForRejectedRequest({ response, name, summary }: ThrowForRejectedRequestParams): Promise<never> {
    if (response.status >= 400 && response.status < 500) {
        throw new WaitpointRejectedError(await readRejectionMessage({ response, summary }))
    }
    throw new EngineGenericError(name, `${summary}: ${response.status} ${response.statusText}`)
}

async function readRejectionMessage({ response, summary }: ReadRejectionMessageParams): Promise<string> {
    const { data: body } = await tryCatch(() => response.text())
    const { data: parsed } = tryCatchSync(() => rejectionBodySchema.parse(JSON.parse(body ?? '')))
    return parsed?.params?.message ?? parsed?.message ?? `${summary}: ${response.status} ${response.statusText}`
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

type ThrowForRejectedRequestParams = {
    response: Response
    name: string
    summary: string
}

type ReadRejectionMessageParams = {
    response: Response
    summary: string
}
