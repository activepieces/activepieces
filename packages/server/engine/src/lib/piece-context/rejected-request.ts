import { ErrorCode, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { EngineGenericError, PausedFlowTimeoutError, WaitpointRejectedError } from '@activepieces/shared'
import { z } from 'zod'

export async function throwForRejectedRequest({ response, name, summary }: ThrowForRejectedRequestParams): Promise<never> {
    const parsed = await readRejectionBody(response)
    if (parsed?.code === ErrorCode.PAUSED_FLOW_TIMEOUT_EXCEEDED) {
        throw new PausedFlowTimeoutError(undefined, parsed.params?.pauseTimeoutDays)
    }
    if (response.status >= 400 && response.status < 500) {
        throw new WaitpointRejectedError(parsed?.params?.message ?? parsed?.message ?? `${summary}: ${response.status} ${response.statusText}`)
    }
    throw new EngineGenericError(name, `${summary}: ${response.status} ${response.statusText}`)
}

const rejectionBodySchema = z.object({
    code: z.string().optional(),
    params: z.object({
        message: z.string().optional(),
        pauseTimeoutDays: z.number().optional(),
    }).optional(),
    message: z.string().optional(),
})

async function readRejectionBody(response: Response): Promise<RejectionBody | null> {
    const { data: body } = await tryCatch(() => response.text())
    const { data: parsed } = tryCatchSync(() => rejectionBodySchema.parse(JSON.parse(body ?? '')))
    return parsed ?? null
}

type RejectionBody = z.infer<typeof rejectionBodySchema>

type ThrowForRejectedRequestParams = {
    response: Response
    name: string
    summary: string
}
