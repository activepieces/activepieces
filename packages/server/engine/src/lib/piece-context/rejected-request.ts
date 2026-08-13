import { tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { EngineGenericError, WaitpointRejectedError } from '@activepieces/shared'
import { z } from 'zod'

export async function throwForRejectedRequest({ response, name, summary }: ThrowForRejectedRequestParams): Promise<never> {
    if (response.status >= 400 && response.status < 500) {
        throw new WaitpointRejectedError(await readRejectionMessage({ response, summary }))
    }
    throw new EngineGenericError(name, `${summary}: ${response.status} ${response.statusText}`)
}

const rejectionBodySchema = z.object({
    params: z.object({ message: z.string().optional() }).optional(),
    message: z.string().optional(),
})

async function readRejectionMessage({ response, summary }: ReadRejectionMessageParams): Promise<string> {
    const { data: body } = await tryCatch(() => response.text())
    const { data: parsed } = tryCatchSync(() => rejectionBodySchema.parse(JSON.parse(body ?? '')))
    return parsed?.params?.message ?? parsed?.message ?? `${summary}: ${response.status} ${response.statusText}`
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
