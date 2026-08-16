import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, ErrorCode, isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { DraftAgentResponse } from '@activepieces/shared'
import { generateText, Output, zodSchema } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { agentHelpers } from './agent-helpers'

const DRAFT_TIMEOUT_MS = 30_000
const DRAFT_SYSTEM_PROMPT = readFileSync(path.resolve('packages/server/api/src/assets/prompts/agent-draft-prompt.md'), 'utf8')

export const agentDraftAi = (log: FastifyBaseLogger) => ({
    async draft({ platformId, prompt }: DraftParams): Promise<DraftAgentResponse> {
        const { data: model, error: modelError } = await tryCatch(() => agentHelpers.resolveFastModel({ platformId, log }))
        if (!isNil(modelError) || isNil(model)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Connect an AI provider before drafting an agent, or start from a starter agent instead' },
            })
        }

        const { data: generated, error: generateError } = await tryCatch(() => generateText({
            model,
            instructions: DRAFT_SYSTEM_PROMPT,
            prompt,
            output: Output.object({ schema: zodSchema(DraftAgentResponse) }),
            telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-draft' }),
            abortSignal: AbortSignal.timeout(DRAFT_TIMEOUT_MS),
        }))
        if (!isNil(generateError) || isNil(generated)) {
            log.warn({ error: generateError, platform: { id: platformId } }, '[agentDraftAi] Could not draft an agent')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Could not draft an agent from that description, try rewording it' },
            })
        }
        return generated.output
    },
})

type DraftParams = {
    platformId: PlatformId
    prompt: string
}
